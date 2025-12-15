import { NextResponse } from 'next/server';
import { fetchWithTimeoutAndRetry } from '@/lib/utils';
import rateLimiter from '@/lib/rate-limiter';

export async function POST(req: Request) {
  try {
    // Check rate limiting for streaming endpoint
    const endpoint = '/api/structured-lesson/stream';
    if (!rateLimiter.isAllowed(endpoint)) {
      const timeUntilReset = rateLimiter.getTimeUntilNextRequest(endpoint);
      const secondsUntilReset = Math.ceil(timeUntilReset / 1000);
      
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          message: `Too many requests. Please try again in ${secondsUntilReset} seconds.`,
          retryAfter: secondsUntilReset
        }, 
        { status: 429 }
      );
    }

    const body = await req.json();
    const { topic, age } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Log the request for debugging
    console.log('Structured lesson stream request received:', { topic: topic.substring(0, 100) + '...', age });

    // Proxy the request to the backend service
    try {
      const backendBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
      const streamUrl = `${backendBase.replace(/\/$/, '')}/api/structured-lesson/stream`;
      
      // Validate backend URL
      try {
        new URL(streamUrl);
      } catch (e) {
        console.error('Invalid backend URL:', streamUrl);
        return NextResponse.json({ error: 'Invalid service configuration' }, { status: 500 });
      }
      
      const backendResponse = await fetchWithTimeoutAndRetry(
        streamUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, age }),
        },
        { timeoutMs: 30_000, retries: 2, retryDelayMs: 500 }
      );

      if (backendResponse.ok) {
        // Stream the response back to the client
        const stream = backendResponse.body;
        return new NextResponse(stream, {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }

      // Handle specific error cases
      if (backendResponse.status === 404) {
        console.error('Backend structured lesson stream endpoint not found:', streamUrl);
        return NextResponse.json(
          { error: 'Structured lesson stream service not found', details: 'The requested service endpoint is not available' },
          { status: 404 }
        );
      }

      // Non-OK from backend: return a clear error to the client
      const errorText = await backendResponse.text();
      console.error('Backend structured lesson stream error:', backendResponse.status, errorText);
      return NextResponse.json(
        {
          error: 'Structured lesson service is temporarily unavailable',
          details: backendResponse.status === 503 ? 'Service configuration issue' : 'Internal server error',
        },
        { status: backendResponse.status }
      );
    } catch (backendError) {
      console.error('Backend connection error:', backendError);
      return NextResponse.json(
        {
          error: 'Unable to connect to structured lesson service',
          details: 'Please check your internet connection or try again later',
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Structured lesson API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? '*' : 'https://lanamind.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Trace-ID, X-API-Key',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}