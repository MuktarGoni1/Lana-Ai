import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const VIDEO_API_URL = process.env.VIDEO_API_URL;
const VIDEO_API_KEY = process.env.VIDEO_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    if (!VIDEO_API_URL || !VIDEO_API_KEY) {
      console.error('[Video API] Missing environment variables:', {
        hasUrl: !!VIDEO_API_URL,
        hasKey: !!VIDEO_API_KEY
      });
      return NextResponse.json(
        { error: 'Video API configuration error' },
        { status: 500 }
      );
    }

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { topic, style, maxDuration } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Forward to video API
    const response = await fetch(`${VIDEO_API_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'X-API-Key': VIDEO_API_KEY!,
      },
      body: JSON.stringify({
        topic,
        style,
        maxDuration: maxDuration || 180,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Video API] Error response:', {
        status: response.status,
        body: errorText,
        url: VIDEO_API_URL
      });
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Unknown error' };
      }
      return NextResponse.json(
        { error: errorData.error || 'Failed to generate video' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Video API] Generation error:', {
      message: error.message,
      stack: error.stack,
      url: VIDEO_API_URL
    });
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
