
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

    // ✅ AGREGAÇÃO CORRETA E CONSERVADORA
    const firstTick = group[0]
    const lastTick = group[group.length - 1]
    
    const open = parseFloat(firstTick.open?.toString() || firstTick.close?.toString() || '0')
    const close = parseFloat(lastTick.close?.toString() || lastTick.open?.toString() || '0')
    
    // ✅ HIGH/LOW REALISTAS - pegar apenas de open/close de cada tick
    const allOpenClosePrices: number[] = []
    group.forEach(tick => {
      const tickOpen = parseFloat(tick.open?.toString() || '0')
      const tickClose = parseFloat(tick.close?.toString() || '0')
      if (tickOpen > 0) allOpenClosePrices.push(tickOpen)
      if (tickClose > 0) allOpenClosePrices.push(tickClose)
      
      // ✅ INCLUIR HIGH/LOW APENAS SE FOREM REALISTAS
      const tickHigh = parseFloat(tick.high?.toString() || '0')
      const tickLow = parseFloat(tick.low?.toString() || '0')
      
      // Validar se high/low são realistas (dentro de 5% do open/close do tick)
      const tickRange = Math.abs(tickClose - tickOpen)
      const maxRealisticRange = Math.max(tickOpen, tickClose) * 0.05  // 5% máximo
      
      if (tickHigh > 0 && tickHigh <= Math.max(tickOpen, tickClose) + maxRealisticRange) {
        allOpenClosePrices.push(tickHigh)
      }
      if (tickLow > 0 && tickLow >= Math.min(tickOpen, tickClose) - maxRealisticRange) {
        allOpenClosePrices.push(tickLow)
      }
    })
    
    // Usar apenas preços validados
    const high = allOpenClosePrices.length > 0 ? Math.max(...allOpenClosePrices) : Math.max(open, close)
    const low = allOpenClosePrices.length > 0 ? Math.min(...allOpenClosePrices) : Math.min(open, close)
    
    // ✅ VALIDAÇÃO FINAL DA LÓGICA OHLC
    const finalHigh = Math.max(high, open, close)
    const finalLow = Math.min(low, open, close)
    
    // Verificar se os dados fazem sentido
    if (finalHigh < Math.max(open, close) || finalLow > Math.min(open, close)) {
      console.error(`[AGGREGATE-VALIDATION] OHLC inválido: O=${open} H=${finalHigh} L=${finalLow} C=${close}`)
    }
    
    const volume = group.reduce((sum, tick) => sum + (parseInt(tick.volume?.toString() || '0')), 0)

    // Create ISO timestamp for the interval start
    const intervalTimestamp = new Date(intervalStart * 1000).toISOString()

    const aggregatedCandle = {
      symbol: group[0].symbol,
      timestamp: intervalTimestamp,
      open: open,
      high: finalHigh,
      low: finalLow,
      close: close,
      volume: volume,
      tickCount: group.length
    }

    // ✅ VALIDAÇÃO FINAL ANTES DE ADICIONAR
    const priceRange = Math.abs(close - open)
    const wickRange = (finalHigh - finalLow) - priceRange
    const wickPercentage = priceRange > 0 ? (wickRange / priceRange) * 100 : 0
    
    if (wickPercentage > 200) {  // Se wick for mais de 200% do corpo do candle
      console.warn(`[AGGREGATE-VALIDATION] Wick muito grande detectado: ${wickPercentage.toFixed(1)}% para candle ${intervalTimestamp}`)
    }

    aggregatedCandles.push(aggregatedCandle)
  })

  console.log(`[AGGREGATE-DATA] Created ${aggregatedCandles.length} aggregated candles`)
  
  if (aggregatedCandles.length > 0) {
    const sample = aggregatedCandles[0]
    console.log(`[AGGREGATE-DATA] Sample aggregated candle:`, {
      timestamp: sample.timestamp,
      ohlc: {
        open: sample.open,
        high: sample.high,
        low: sample.low,
        close: sample.close
      },
      volume: sample.volume,
      tickCount: sample.tickCount,
      priceRange: Math.abs(sample.close - sample.open),
      wickSize: (sample.high - sample.low) - Math.abs(sample.close - sample.open)
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
