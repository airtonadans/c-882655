
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
    const timeframe = url.searchParams.get('timeframe') || '1m'
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const limit = parseInt(url.searchParams.get('limit') || '1000')

    console.log(`Getting market data for ${symbol}, timeframe: ${timeframe}`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Build query
    let query = supabase
      .from('tick_data')
      .select('*')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: true })
      .limit(limit)

    if (startDate) {
      query = query.gte('timestamp', startDate)
    }
    if (endDate) {
      query = query.lte('timestamp', endDate)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    // Convert tick data to the format expected by the chart
    const formattedData = data.map((tick: any) => ({
      time: Math.floor(new Date(tick.timestamp).getTime() / 1000), // Unix timestamp
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
        timeframe
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
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
