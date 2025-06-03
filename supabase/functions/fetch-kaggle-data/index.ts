
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { symbol = 'XAUUSD', startDate, endDate } = await req.json()

    console.log(`Fetching data for ${symbol} from ${startDate} to ${endDate}`)

    // Get Kaggle credentials from Supabase secrets
    const kaggleUsername = Deno.env.get('KAGGLE_USERNAME')
    const kaggleKey = Deno.env.get('KAGGLE_API_KEY')

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (!kaggleUsername || !kaggleKey) {
      console.log('Kaggle credentials not found, generating simulated data...')
      return await generateSimulatedData(supabase, symbol, startDate, endDate)
    }

    try {
      console.log('Attempting to fetch real Kaggle data...')
      
      // Try to fetch real Kaggle data first
      const realData = await fetchKaggleData(kaggleUsername, kaggleKey, symbol, startDate, endDate)
      
      if (realData && realData.length > 0) {
        // Insert real data in batches
        const batchSize = 100
        let insertedCount = 0

        for (let i = 0; i < realData.length; i += batchSize) {
          const batch = realData.slice(i, i + batchSize)
          
          const { error } = await supabase
            .from('tick_data')
            .insert(batch)

          if (error) {
            console.error('Error inserting real data batch:', error)
            throw error
          }

          insertedCount += batch.length
        }

        // Update available data ranges
        await supabase
          .from('available_data_ranges')
          .upsert({
            symbol,
            start_date: startDate,
            end_date: endDate,
            total_ticks: insertedCount,
            last_updated: new Date().toISOString()
          })

        console.log(`Successfully processed and stored ${insertedCount} real Kaggle records`)

        return new Response(
          JSON.stringify({
            success: true,
            message: `Dados reais do Kaggle carregados: ${insertedCount} registros para ${symbol}`,
            tickCount: insertedCount,
            dateRange: { startDate, endDate },
            source: 'kaggle-real-data'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
    } catch (kaggleError) {
      console.error('Kaggle API error, falling back to simulated data:', kaggleError)
    }

    // Fallback to simulated data if Kaggle fails
    console.log('Generating realistic simulated data as fallback...')
    return await generateSimulatedData(supabase, symbol, startDate, endDate)

  } catch (error) {
    console.error('Error in fetch-kaggle-data function:', error)
    return new Response(
      JSON.stringify({
        error: `Erro ao processar dados: ${error.message}`,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

async function fetchKaggleData(username: string, apiKey: string, symbol: string, startDate: string, endDate: string) {
  try {
    // Kaggle API authentication using basic auth
    const auth = btoa(`${username}:${apiKey}`)
    
    // For now, we'll simulate a Kaggle API call since the exact dataset structure varies
    // In production, you would use the actual Kaggle API endpoints for financial data
    console.log('Simulating Kaggle API call with real credentials...')
    
    // This is where you would make the actual Kaggle API call:
    // const response = await fetch('https://www.kaggle.com/api/v1/datasets/download/...')
    
    // For demonstration, we'll return null to trigger fallback to simulated data
    // but with proper error handling for real implementation
    return null
    
  } catch (error) {
    console.error('Kaggle API fetch error:', error)
    throw error
  }
}

async function generateSimulatedData(supabase: any, symbol: string, startDate: string, endDate: string) {
  console.log('Generating simulated data...')
  
  const tickData = await generateRealisticTickData(symbol, startDate, endDate)
  
  // Insert simulated data
  const batchSize = 100
  let insertedCount = 0

  for (let i = 0; i < tickData.length; i += batchSize) {
    const batch = tickData.slice(i, i + batchSize)
    
    const { error } = await supabase
      .from('tick_data')
      .insert(batch)

    if (error) {
      console.error('Error inserting simulated batch:', error)
      throw error
    }

    insertedCount += batch.length
  }

  // Update available data ranges
  await supabase
    .from('available_data_ranges')
    .upsert({
      symbol,
      start_date: startDate,
      end_date: endDate,
      total_ticks: insertedCount,
      last_updated: new Date().toISOString()
    })

  return new Response(
    JSON.stringify({
      success: true,
      message: `Dados simulados realistas gerados: ${insertedCount} registros para ${symbol}`,
      tickCount: insertedCount,
      dateRange: { startDate, endDate },
      source: 'simulated-realistic-data'
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    },
  )
}

async function generateRealisticTickData(symbol: string, startDate: string, endDate: string) {
  const tickData = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  let currentTime = new Date(start)

  // Set realistic starting prices based on symbol
  let lastPrice = getStartingPrice(symbol)
  
  // Generate data for each hour of the selected period
  while (currentTime <= end) {
    // Generate multiple ticks per hour to simulate real trading
    for (let minute = 0; minute < 60; minute += 5) { // Every 5 minutes
      const tickTime = new Date(currentTime.getTime() + (minute * 60000))
      
      if (tickTime > end) break
      
      // Generate more realistic price movement with trends and volatility
      const volatility = getVolatility(symbol)
      const timeOfDay = tickTime.getHours()
      
      // Add market session volatility (higher during market hours)
      let sessionMultiplier = 1
      if (timeOfDay >= 8 && timeOfDay <= 17) {
        sessionMultiplier = 1.5 // Higher volatility during market hours
      }
      
      const trendFactor = Math.sin(tickTime.getTime() / (1000 * 60 * 60 * 24)) * 0.001 // Daily trend
      const randomChange = (Math.random() - 0.5) * volatility * sessionMultiplier
      const change = trendFactor + randomChange
      
      const newPrice = lastPrice * (1 + change)
      const spread = lastPrice * 0.0001 // Small spread
      const high = Math.max(lastPrice, newPrice) + spread
      const low = Math.min(lastPrice, newPrice) - spread
      
      const tick = {
        symbol,
        timestamp: tickTime.toISOString(),
        open: parseFloat(lastPrice.toFixed(5)),
        high: parseFloat(high.toFixed(5)),
        low: parseFloat(low.toFixed(5)),
        close: parseFloat(newPrice.toFixed(5)),
        volume: Math.floor(Math.random() * 500) + 50
      }

      tickData.push(tick)
      lastPrice = newPrice
    }
    
    // Move to next hour
    currentTime.setHours(currentTime.getHours() + 1)
  }

  return tickData
}

function getStartingPrice(symbol: string): number {
  switch (symbol) {
    case 'XAUUSD':
      return 2000.0 + (Math.random() * 100) // Gold price with some variation
    case 'BTCUSD':
      return 45000.0 + (Math.random() * 5000) // Bitcoin price
    case 'EURUSD':
      return 1.08 + (Math.random() * 0.05) // EUR/USD
    default:
      return 2000.0 + (Math.random() * 100)
  }
}

function getVolatility(symbol: string): number {
  switch (symbol) {
    case 'XAUUSD':
      return 0.002 // 0.2% volatility
    case 'BTCUSD':
      return 0.02 // 2% volatility
    case 'EURUSD':
      return 0.001 // 0.1% volatility
    default:
      return 0.002
  }
}
