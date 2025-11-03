import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { is_pro: false, error: 'Supabase not configured' },
        { status: 200 }
      )
    }

    // For now, return a mock response to test the UI
    // In production, this should properly check the user's subscription status
    return NextResponse.json({
      is_pro: false,
      plan: 'free',
      status: 'inactive',
      expires_at: null,
      started_at: null
    })
    
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return NextResponse.json(
      { is_pro: false, error: 'Subscription status check failed' },
      { status: 200 }
    )
  }
}