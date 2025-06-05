
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

    // Process data according to timeframe with proper aggregation
    const processedData = aggregateDataByTimeframe(data, timeframe)
    console.log(`[GET-MARKET-DATA] Aggregated to ${processedData.length} records for timeframe ${timeframe}`)

    // Convert to chart format with proper timestamp handling
    const formattedData = processedData.map((candle: any) => {
      const timestamp = new Date(candle.timestamp)
      const unixTime = Math.floor(timestamp.getTime() / 1000)
      
      return {
        timestamp: candle.timestamp,
        time: unixTime,
        open: parseFloat(candle.open?.toString() || '0'),
        high: parseFloat(candle.high?.toString() || '0'),
        low: parseFloat(candle.low?.toString() || '0'),
        close: parseFloat(candle.close?.toString() || '0'),
        volume: parseInt(candle.volume?.toString() || '0')
      }
    })

    console.log(`[GET-MARKET-DATA] Final formatted data: ${formattedData.length} records`)
    
    if (formattedData.length > 0) {
      console.log(`[GET-MARKET-DATA] Sample data point:`, formattedData[0])
      console.log(`[GET-MARKET-DATA] Time interval check:`, {
        firstTime: formattedData[0].timestamp,
        secondTime: formattedData[1]?.timestamp,
        intervalSeconds: formattedData[1] ? (formattedData[1].time - formattedData[0].time) : 'N/A'
      })
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

function aggregateDataByTimeframe(data: any[], timeframe: string) {
  console.log(`[AGGREGATE-DATA] Starting aggregation of ${data.length} records for timeframe ${timeframe}`)
  
  if (!data || data.length === 0) {
    return []
  }

  const intervalSeconds = getIntervalSeconds(timeframe)
  console.log(`[AGGREGATE-DATA] Using interval of ${intervalSeconds} seconds`)
  
  // Group data by time intervals
  const grouped = new Map<number, any[]>()
  
  data.forEach(tick => {
    const tickTime = new Date(tick.timestamp)
    const tickUnixTime = Math.floor(tickTime.getTime() / 1000)
    
    // Calculate the interval start time (floor to the nearest interval)
    const intervalStart = Math.floor(tickUnixTime / intervalSeconds) * intervalSeconds
    
    if (!grouped.has(intervalStart)) {
      grouped.set(intervalStart, [])
    }
    grouped.get(intervalStart)!.push(tick)
  })

  console.log(`[AGGREGATE-DATA] Grouped into ${grouped.size} intervals`)

  // Aggregate grouped data into OHLCV candles
  const aggregatedCandles: any[] = []
  
  // Sort intervals to ensure chronological order
  const sortedIntervals = Array.from(grouped.keys()).sort((a, b) => a - b)
  
  sortedIntervals.forEach(intervalStart => {
    const group = grouped.get(intervalStart)!
    
    if (group.length === 0) return

    // Sort group by timestamp to ensure proper OHLC calculation
    group.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    // Calculate OHLCV for this interval
    const open = parseFloat(group[0].open?.toString() || group[0].close?.toString() || '0')
    const close = parseFloat(group[group.length - 1].close?.toString() || group[group.length - 1].open?.toString() || '0')
    
    // Get all price values to calculate high and low
    const allPrices: number[] = []
    group.forEach(tick => {
      const prices = [
        parseFloat(tick.open?.toString() || '0'),
        parseFloat(tick.high?.toString() || '0'),
        parseFloat(tick.low?.toString() || '0'),
        parseFloat(tick.close?.toString() || '0')
      ].filter(p => p > 0)
      allPrices.push(...prices)
    })
    
    const high = allPrices.length > 0 ? Math.max(...allPrices) : open
    const low = allPrices.length > 0 ? Math.min(...allPrices) : open
    const volume = group.reduce((sum, tick) => sum + (parseInt(tick.volume?.toString() || '0')), 0)

    // Create ISO timestamp for the interval start
    const intervalTimestamp = new Date(intervalStart * 1000).toISOString()

    const aggregatedCandle = {
      symbol: group[0].symbol,
      timestamp: intervalTimestamp,
      open: open,
      high: high,
      low: low,
      close: close,
      volume: volume,
      tickCount: group.length
    }

    aggregatedCandles.push(aggregatedCandle)
  })

  console.log(`[AGGREGATE-DATA] Created ${aggregatedCandles.length} aggregated candles`)
  
  if (aggregatedCandles.length > 0) {
    console.log(`[AGGREGATE-DATA] Sample aggregated candle:`, {
      timestamp: aggregatedCandles[0].timestamp,
      ohlc: {
        open: aggregatedCandles[0].open,
        high: aggregatedCandles[0].high,
        low: aggregatedCandles[0].low,
        close: aggregatedCandles[0].close
      },
      volume: aggregatedCandles[0].volume,
      tickCount: aggregatedCandles[0].tickCount
    })
  }

  return aggregatedCandles
}

function getIntervalSeconds(timeframe: string): number {
  switch (timeframe) {
    case '1s': return 1
    case '5s': return 5
    case '10s': return 10
    case '30s': return 30
    case '1min': return 60
    case '2min': return 120
    case '5min': return 300
    case '10min': return 600
    case '15min': return 900
    case '30min': return 1800
    case '1h': return 3600
    case '2h': return 7200
    case '4h': return 14400
    case '1d': return 86400
    default: 
      console.log(`[GET-INTERVAL] Unknown timeframe ${timeframe}, defaulting to 5min`)
      return 300
  }
}
