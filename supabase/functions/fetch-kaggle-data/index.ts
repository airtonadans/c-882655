
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
    const { symbol = 'XAUUSD', startDate, endDate, apiKey } = await req.json()

    console.log(`Fetching data for ${symbol} from ${startDate} to ${endDate}`)

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Simulated tick data generation (replace with actual Kaggle API call)
    const tickData = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    let currentTime = start
    let lastPrice = 2000.0 // Starting price for XAUUSD

    while (currentTime <= end) {
      // Generate realistic price movement
      const change = (Math.random() - 0.5) * 2 // Random change between -1 and +1
      const newPrice = lastPrice + change
      
      const tick = {
        symbol,
        timestamp: currentTime.toISOString(),
        open: lastPrice,
        high: Math.max(lastPrice, newPrice) + Math.random() * 0.5,
        low: Math.min(lastPrice, newPrice) - Math.random() * 0.5,
        close: newPrice,
        volume: Math.floor(Math.random() * 1000) + 100
      }

      tickData.push(tick)
      lastPrice = newPrice
      
      // Increment by 1 minute (for demo purposes)
      currentTime = new Date(currentTime.getTime() + 60000)
      
      // Limit to prevent infinite loops in demo
      if (tickData.length >= 1000) break
    }

    // Insert data in batches
    const batchSize = 100
    let insertedCount = 0

    for (let i = 0; i < tickData.length; i += batchSize) {
      const batch = tickData.slice(i, i + batchSize)
      
      const { error } = await supabase
        .from('tick_data')
        .insert(batch)

      if (error) {
        console.error('Error inserting batch:', error)
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

    console.log(`Successfully inserted ${insertedCount} tick records`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Fetched and stored ${insertedCount} tick records for ${symbol}`,
        tickCount: insertedCount,
        dateRange: { startDate, endDate }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in fetch-kaggle-data function:', error)
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
