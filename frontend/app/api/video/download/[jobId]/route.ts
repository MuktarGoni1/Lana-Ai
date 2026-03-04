import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const VIDEO_API_URL = process.env.VIDEO_API_URL;
const VIDEO_API_KEY = process.env.VIDEO_API_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
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

    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Forward to video API
    const response = await fetch(`${VIDEO_API_URL}/api/video/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'X-API-Key': VIDEO_API_KEY!,
        'Range': request.headers.get('range') || '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { error: errorData.error || 'Failed to get video' },
        { status: response.status }
      );
    }

    // Stream the video response
    const headers = new Headers(response.headers);
    
    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });

  } catch (error: any) {
    console.error('[Video API] Download error:', {
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
