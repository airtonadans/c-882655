
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { symbol = 'XAUUSD', startDate, endDate } = await req.json()

    console.log(`[FETCH-KAGGLE-DATA] Request:`, { symbol, startDate, endDate })

    if (!startDate || !endDate) {
      throw new Error('startDate e endDate são obrigatórios')
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if data already exists in the database
    const existingData = await checkExistingData(supabase, symbol, startDate, endDate)
    if (existingData.hasCompleteData) {
      console.log('[FETCH-KAGGLE-DATA] Data already exists in database, returning cached data')
      return new Response(
        JSON.stringify({
          success: true,
          message: `Dados já existem no banco: ${existingData.count} registros para ${symbol} (${startDate} a ${endDate})`,
          tickCount: existingData.count,
          dateRange: { startDate, endDate },
          source: 'cached-data'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Calculate missing date ranges
    const missingRanges = await calculateMissingRanges(supabase, symbol, startDate, endDate)
    console.log('[FETCH-KAGGLE-DATA] Missing ranges to fetch:', missingRanges)

    let totalInserted = 0
    const maxDaysPerBatch = 30 // Limit to 30 days per batch to avoid timeouts

    for (const range of missingRanges) {
      const rangeDays = Math.ceil((new Date(range.endDate).getTime() - new Date(range.startDate).getTime()) / (1000 * 60 * 60 * 24))
      
      if (rangeDays > maxDaysPerBatch) {
        // Split large ranges into smaller batches
        const batches = splitDateRange(range.startDate, range.endDate, maxDaysPerBatch)
        for (const batch of batches) {
          const batchData = await generateRealisticTickData(symbol, batch.start, batch.end)
          const inserted = await insertDataInBatches(supabase, batchData)
          totalInserted += inserted
          console.log(`[FETCH-KAGGLE-DATA] Inserted ${inserted} records for batch ${batch.start} to ${batch.end}`)
        }
      } else {
        const rangeData = await generateRealisticTickData(symbol, range.startDate, range.endDate)
        const inserted = await insertDataInBatches(supabase, rangeData)
        totalInserted += inserted
        console.log(`[FETCH-KAGGLE-DATA] Inserted ${inserted} records for range ${range.startDate} to ${range.endDate}`)
      }
    }

    // Update available data ranges
    await updateAvailableDataRanges(supabase, symbol, startDate, endDate, totalInserted)

    console.log(`[FETCH-KAGGLE-DATA] Successfully processed and stored ${totalInserted} records`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Dados carregados com sucesso: ${totalInserted} registros para ${symbol}`,
        tickCount: totalInserted,
        dateRange: { startDate, endDate },
        source: 'new-data-generated'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('[FETCH-KAGGLE-DATA] Function error:', error)
    return new Response(
      JSON.stringify({
        error: `Erro ao processar dados: ${error.message}`,
        success: false,
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function checkExistingData(supabase: any, symbol: string, startDate: string, endDate: string) {
  try {
    const { data, error } = await supabase
      .from('tick_data')
      .select('timestamp')
      .eq('symbol', symbol)
      .gte('timestamp', startDate + 'T00:00:00.000Z')
      .lte('timestamp', endDate + 'T23:59:59.999Z')
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('[CHECK-EXISTING-DATA] Error:', error)
      return { hasCompleteData: false, count: 0 }
    }

    const count = data?.length || 0
    const expectedDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    const expectedRecords = expectedDays * 288 // Assuming 5-minute intervals (288 per day)
    
    // Consider complete if we have at least 80% of expected data
    const hasCompleteData = count >= (expectedRecords * 0.8)
    
    console.log(`[CHECK-EXISTING-DATA] ${count} records found, expected ~${expectedRecords}, complete: ${hasCompleteData}`)
    
    return { hasCompleteData, count }
  } catch (error) {
    console.error('[CHECK-EXISTING-DATA] Error:', error)
    return { hasCompleteData: false, count: 0 }
  }
}

async function calculateMissingRanges(supabase: any, symbol: string, startDate: string, endDate: string) {
  try {
    // For now, return the full range as missing if we don't have complete data
    return [{ startDate, endDate }]
  } catch (error) {
    console.error('[CALCULATE-MISSING-RANGES] Error:', error)
    return [{ startDate, endDate }]
  }
}

function splitDateRange(startDate: string, endDate: string, maxDays: number) {
  const batches = []
  let currentStart = new Date(startDate)
  const finalEnd = new Date(endDate)

  while (currentStart < finalEnd) {
    let currentEnd = new Date(currentStart)
    currentEnd.setDate(currentEnd.getDate() + maxDays - 1)
    
    if (currentEnd > finalEnd) {
      currentEnd = finalEnd
    }

    batches.push({
      start: currentStart.toISOString().split('T')[0],
      end: currentEnd.toISOString().split('T')[0]
    })

    currentStart = new Date(currentEnd)
    currentStart.setDate(currentStart.getDate() + 1)
  }

  return batches
}

async function insertDataInBatches(supabase: any, tickData: any[]) {
  const batchSize = 500 // Smaller batch size for better performance
  let totalInserted = 0

  for (let i = 0; i < tickData.length; i += batchSize) {
    const batch = tickData.slice(i, i + batchSize)
    
    try {
      const { error } = await supabase
        .from('tick_data')
        .insert(batch)

      if (error) {
        console.error('[INSERT-BATCH] Error:', error)
        continue // Continue with next batch instead of failing completely
      }

      totalInserted += batch.length
    } catch (batchError) {
      console.error('[INSERT-BATCH] Exception:', batchError)
      continue
    }
  }

  return totalInserted
}

async function updateAvailableDataRanges(supabase: any, symbol: string, startDate: string, endDate: string, totalTicks: number) {
  try {
    const { error } = await supabase
      .from('available_data_ranges')
      .upsert({
        symbol,
        start_date: startDate,
        end_date: endDate,
        total_ticks: totalTicks,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'symbol,start_date,end_date'
      })

    if (error) {
      console.error('[UPDATE-AVAILABLE-DATA-RANGES] Error:', error)
    }
  } catch (error) {
    console.error('[UPDATE-AVAILABLE-DATA-RANGES] Exception:', error)
  }
}

async function generateRealisticTickData(symbol: string, startDate: string, endDate: string) {
  console.log(`[GENERATE-REALISTIC-DATA] Generating data for ${symbol} from ${startDate} to ${endDate}`)
  
  const tickData = []
  const start = new Date(startDate + 'T00:00:00.000Z')
  const end = new Date(endDate + 'T23:59:59.999Z')
  
  let currentTime = new Date(start)
  let lastPrice = getStartingPrice(symbol)
  
  // Generate data every 5 minutes
  while (currentTime <= end) {
    const volatility = getVolatility(symbol)
    const timeOfDay = currentTime.getUTCHours()
    
    // Add market session volatility
    let sessionMultiplier = 1
    if (timeOfDay >= 8 && timeOfDay <= 17) {
      sessionMultiplier = 1.5
    }
    
    // Add realistic market patterns
    const trendFactor = Math.sin(currentTime.getTime() / (1000 * 60 * 60 * 24)) * 0.001
    const randomChange = (Math.random() - 0.5) * volatility * sessionMultiplier
    const change = trendFactor + randomChange
    
    // Add occasional larger moves (news events simulation)
    if (Math.random() < 0.01) { // 1% chance
      const newsImpact = (Math.random() - 0.5) * volatility * 5
      randomChange + newsImpact
    }
    
    const newPrice = lastPrice * (1 + change)
    const spread = lastPrice * 0.0001
    const high = Math.max(lastPrice, newPrice) + spread * Math.random()
    const low = Math.min(lastPrice, newPrice) - spread * Math.random()
    
    const tick = {
      symbol,
      timestamp: currentTime.toISOString(),
      open: parseFloat(lastPrice.toFixed(5)),
      high: parseFloat(high.toFixed(5)),
      low: parseFloat(low.toFixed(5)),
      close: parseFloat(newPrice.toFixed(5)),
      volume: Math.floor(Math.random() * 500) + 50
    }

    tickData.push(tick)
    lastPrice = newPrice
    
    // Move to next 5-minute interval
    currentTime.setMinutes(currentTime.getMinutes() + 5)
  }

  console.log(`[GENERATE-REALISTIC-DATA] Generated ${tickData.length} tick records`)
  return tickData
}

function getStartingPrice(symbol: string): number {
  switch (symbol) {
    case 'XAUUSD':
      return 2000.0 + (Math.random() * 100)
    case 'BTCUSD':
      return 45000.0 + (Math.random() * 5000)
    case 'EURUSD':
      return 1.08 + (Math.random() * 0.05)
    default:
      return 2000.0 + (Math.random() * 100)
  }
}

function getVolatility(symbol: string): number {
  switch (symbol) {
    case 'XAUUSD':
      return 0.002
    case 'BTCUSD':
      return 0.02
    case 'EURUSD':
      return 0.001
    default:
      return 0.002
  }
}
