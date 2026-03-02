import { NextResponse } from 'next/server';
import { fetchWithTimeoutAndRetry } from '@/lib/utils';
import serverRateLimiter from '@/lib/server-rate-limiter';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';

export async function POST(req: Request) {
  try {
    // Check authentication first
    const user = await requireAuth();
    if (!user) {
      return unauthorizedResponse();
    }

    // Check server-side rate limiting (primary defense)
    const endpoint = '/api/tts';
    const serverRateLimitCheck = await serverRateLimiter.isAllowedSimple(endpoint, req.headers.get('x-forwarded-for') || 'unknown');
    if (!serverRateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          message: `Too many requests. Please try again in ${serverRateLimitCheck.retryAfter} seconds.`,
          retryAfter: serverRateLimitCheck.retryAfter
        }, 
        { 
          status: 429,
          headers: {
            'Retry-After': serverRateLimitCheck.retryAfter?.toString() || '60'
          }
        }
      );
    }
    
    const body = await req.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Log the request for debugging
    console.log('TTS request received:', { text: text.substring(0, 100) + '...' });

    // Proxy the request to the backend service
    try {
      const backendBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
      const ttsUrl = `${backendBase.replace(/\/$/, '')}/api/tts/`;
      
      // Validate backend URL
      try {
        new URL(ttsUrl);
      } catch (e) {
        console.error('Invalid backend URL:', ttsUrl);
        return NextResponse.json({ error: 'Invalid service configuration' }, { status: 500 });
      }
      
      const backendResponse = await fetchWithTimeoutAndRetry(
        ttsUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        },
        { timeoutMs: 10_000, retries: 2, retryDelayMs: 300 }
      );

      if (backendResponse.ok) {
        const audioBuffer = await backendResponse.arrayBuffer();
        const contentType = backendResponse.headers.get('content-type') || 'audio/mpeg';

        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': 'inline',
          },
        });
      }

      // Handle specific error cases
      if (backendResponse.status === 404) {
        console.error('Backend TTS endpoint not found:', ttsUrl);
        return NextResponse.json(
          { error: 'Text-to-speech service not found', details: 'The requested service endpoint is not available' },
          { status: 404 }
        );
      }

      // Non-OK from backend: return a clear error to the client
      const errorText = await backendResponse.text();
      console.error('Backend TTS error:', backendResponse.status, errorText);
      return NextResponse.json(
        {
          error: 'Text-to-speech service is temporarily unavailable',
          details: backendResponse.status === 503 ? 'TTS service configuration issue' : 'Internal server error',
        },
        { status: backendResponse.status }
      );
    } catch (backendError) {
      console.error('Backend connection error:', backendError);
      return NextResponse.json(
        {
          error: 'Unable to connect to text-to-speech service',
          details: 'Please check your internet connection or try again later',
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Allow CORS for local development
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}