
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
    const url = new URL(req.url)
    const symbol = url.searchParams.get('symbol') || 'XAUUSD'
    const timeframe = url.searchParams.get('timeframe') || '5min'
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const limit = parseInt(url.searchParams.get('limit') || '1000')

    console.log(`Getting market data for ${symbol}, timeframe: ${timeframe}, dates: ${startDate} to ${endDate}, limit: ${limit}`)

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

    // Apply date filters
    if (startDate) {
      const startDateTime = new Date(startDate).toISOString()
      query = query.gte('timestamp', startDateTime)
      console.log(`Applied start date filter: ${startDateTime}`)
    }
    
    if (endDate) {
      const endDateTime = new Date(endDate + 'T23:59:59.999Z').toISOString()
      query = query.lte('timestamp', endDateTime)
      console.log(`Applied end date filter: ${endDateTime}`)
    }

    // Apply limit last to ensure we get the right amount of data
    query = query.limit(limit)

    const { data, error } = await query

    if (error) {
      console.error('Database query error:', error)
      throw error
    }

    console.log(`Query returned ${data?.length || 0} records`)

    if (!data || data.length === 0) {
      console.log('No data found for the specified criteria')
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
    console.log(`Processed to ${processedData.length} records for timeframe ${timeframe}`)

    // Convert to chart format
    const formattedData = processedData.map((tick: any) => ({
      timestamp: tick.timestamp, // Keep original timestamp for compatibility
      time: Math.floor(new Date(tick.timestamp).getTime() / 1000), // Unix timestamp for chart
      open: parseFloat(tick.open),
      high: parseFloat(tick.high),
      low: parseFloat(tick.low),
      close: parseFloat(tick.close),
      volume: tick.volume || 0
    }))

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
    console.error('Error in get-market-data function:', error)
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
  // For 5min timeframe, return data as is since we generate 5-minute intervals
  if (timeframe === '5min') {
    return data
  }

  // For other timeframes, we need to aggregate the data
  const intervalMinutes = getIntervalMinutes(timeframe)
  if (intervalMinutes <= 5) {
    return data // Return raw data for timeframes <= 5min
  }

  // Group data by time intervals
  const grouped: { [key: string]: any[] } = {}
  
  data.forEach(tick => {
    const tickTime = new Date(tick.timestamp)
    const intervalStart = new Date(tickTime)
    intervalStart.setMinutes(Math.floor(intervalStart.getMinutes() / intervalMinutes) * intervalMinutes, 0, 0)
    
    const key = intervalStart.toISOString()
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(tick)
  })

  // Aggregate grouped data
  const aggregated = Object.keys(grouped).map(key => {
    const group = grouped[key]
    if (group.length === 0) return null

    const open = group[0].open
    const close = group[group.length - 1].close
    const high = Math.max(...group.map(t => t.high))
    const low = Math.min(...group.map(t => t.low))
    const volume = group.reduce((sum, t) => sum + (t.volume || 0), 0)

    return {
      symbol: group[0].symbol,
      timestamp: key,
      open,
      high,
      low,
      close,
      volume
    }
  }).filter(Boolean)

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
