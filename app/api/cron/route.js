import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabaseClient'

export async function GET(request) {
  // Security check: ensure the request is coming from Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.VERCEL_CRON_SECRET}`
  ) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    console.log('Running Supabase Keep-Alive Cron...')
    
    // Make a lightweight query to the database to prevent it from pausing.
    // NOTE: You can replace 'keep_alive' with any table you have (e.g. 'users' or 'matches')
    const { error } = await supabase.from('keep_alive').select('id').limit(1)

    if (error && error.code !== '42P01') { 
      // 42P01 is the Postgres error code for "table does not exist". 
      // We ignore it because the query still hit the database and kept it alive!
      console.error('Keep-alive ping error:', error.message)
    }

    console.log('Supabase successfully pinged!')
    return NextResponse.json({ success: true, message: "Database pinged successfully" })
  } catch (error) {
    console.error('Cron job failed:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Force dynamic to prevent Next.js from caching the cron job result
export const dynamic = 'force-dynamic'
