
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
    const url = new URL(req.url)
    const symbol = url.searchParams.get('symbol') || 'XAUUSD'
    const timeframe = url.searchParams.get('timeframe') || '5min'
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const limit = parseInt(url.searchParams.get('limit') || '1000')

    console.log(`[GET-MARKET-DATA] Request params:`, {
      symbol,
      timeframe,
      startDate,
      endDate,
      limit
    })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Build query with proper date filtering
    let query = supabase
      .from('tick_data')
      .select('*')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: true })

    // Apply date filters with proper timezone handling
    if (startDate) {
      const startDateTime = new Date(startDate + 'T00:00:00.000Z').toISOString()
      query = query.gte('timestamp', startDateTime)
      console.log(`[GET-MARKET-DATA] Applied start date filter: ${startDateTime}`)
    }
    
    if (endDate) {
      const endDateTime = new Date(endDate + 'T23:59:59.999Z').toISOString()
      query = query.lte('timestamp', endDateTime)
      console.log(`[GET-MARKET-DATA] Applied end date filter: ${endDateTime}`)
    }

    // Apply limit
    query = query.limit(limit)

    const { data, error } = await query

    if (error) {
      console.error('[GET-MARKET-DATA] Database query error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    console.log(`[GET-MARKET-DATA] Query returned ${data?.length || 0} records`)

    if (!data || data.length === 0) {
      console.log('[GET-MARKET-DATA] No data found for the specified criteria')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Nenhum dado encontrado para o período especificado. Verifique se os dados foram carregados na aba Dados.',
          data: [],
          count: 0,
          symbol,
          timeframe,
          dateRange: { startDate, endDate }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Process data according to timeframe
    const processedData = processDataByTimeframe(data, timeframe)
    console.log(`[GET-MARKET-DATA] Processed to ${processedData.length} records for timeframe ${timeframe}`)

    // Convert to chart format with proper timestamp handling
    const formattedData = processedData.map((tick: any) => {
      const timestamp = new Date(tick.timestamp)
      const unixTime = Math.floor(timestamp.getTime() / 1000)
      
      return {
        timestamp: tick.timestamp,
        time: unixTime,
        open: parseFloat(tick.open?.toString() || '0'),
        high: parseFloat(tick.high?.toString() || '0'),
        low: parseFloat(tick.low?.toString() || '0'),
        close: parseFloat(tick.close?.toString() || '0'),
        volume: parseInt(tick.volume?.toString() || '0')
      }
    })

    console.log(`[GET-MARKET-DATA] Final formatted data: ${formattedData.length} records`)
    
    if (formattedData.length > 0) {
      console.log(`[GET-MARKET-DATA] Sample data point:`, formattedData[0])
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: formattedData,
        count: formattedData.length,
        symbol,
        timeframe,
        dateRange: { startDate, endDate }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('[GET-MARKET-DATA] Function error:', error)
    return new Response(
      JSON.stringify({
        error: `Erro ao obter dados: ${error.message}`,
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

function processDataByTimeframe(data: any[], timeframe: string) {
  console.log(`[PROCESS-DATA] Processing ${data.length} records for timeframe ${timeframe}`)
  
  // For 5min timeframe, return data as is since we generate 5-minute intervals
  if (timeframe === '5min') {
    return data
  }

  const intervalMinutes = getIntervalMinutes(timeframe)
  
  // For timeframes smaller than our base interval, return raw data
  if (intervalMinutes <= 5) {
    return data
  }

  // Group data by time intervals for aggregation
  const grouped: { [key: string]: any[] } = {}
  
  data.forEach(tick => {
    const tickTime = new Date(tick.timestamp)
    
    // Calculate the interval start time
    const intervalStart = new Date(tickTime)
    intervalStart.setMinutes(Math.floor(intervalStart.getMinutes() / intervalMinutes) * intervalMinutes, 0, 0)
    
    const key = intervalStart.toISOString()
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(tick)
  })

  console.log(`[PROCESS-DATA] Grouped into ${Object.keys(grouped).length} intervals`)

  // Aggregate grouped data
  const aggregated = Object.keys(grouped)
    .sort()
    .map(key => {
      const group = grouped[key]
      if (group.length === 0) return null

      // Sort group by timestamp to ensure proper OHLC calculation
      group.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

      const open = parseFloat(group[0].open?.toString() || '0')
      const close = parseFloat(group[group.length - 1].close?.toString() || '0')
      const high = Math.max(...group.map(t => parseFloat(t.high?.toString() || '0')))
      const low = Math.min(...group.map(t => parseFloat(t.low?.toString() || '0')))
      const volume = group.reduce((sum, t) => sum + (parseInt(t.volume?.toString() || '0')), 0)

      return {
        symbol: group[0].symbol,
        timestamp: key,
        open: open,
        high: high,
        low: low,
        close: close,
        volume: volume
      }
    })
    .filter(Boolean)

  console.log(`[PROCESS-DATA] Aggregated to ${aggregated.length} records`)
  return aggregated
}

function getIntervalMinutes(timeframe: string): number {
  switch (timeframe) {
    case '1min': return 1
    case '2min': return 2
    case '5min': return 5
    case '10min': return 10
    case '15min': return 15
    case '30min': return 30
    case '1h': return 60
    case '2h': return 120
    case '4h': return 240
    case '1d': return 1440
    default: return 5
  }
}
