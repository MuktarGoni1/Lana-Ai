import { NextResponse } from 'next/server';
import { fetchWithTimeoutAndRetry } from '@/lib/utils';
import rateLimiter from '@/lib/rate-limiter';

export async function POST(req: Request) {
  try {
    // Check rate limiting
    const endpoint = '/api/chat';
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
    const { userId, message, age } = body;

    if (!userId || !message) {
      return NextResponse.json({ error: 'userId and message are required' }, { status: 400 });
    }

    // Log the request for debugging
    console.log('Chat request received:', { userId, message: message.substring(0, 100) + '...', age });

    // Proxy the request to the backend service
    try {
      const backendBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
      const chatUrl = `${backendBase.replace(/\/$/, '')}/api/chat`;
      
      // Validate backend URL
      try {
        new URL(chatUrl);
      } catch (e) {
        console.error('Invalid backend URL:', chatUrl);
        return NextResponse.json({ error: 'Invalid service configuration' }, { status: 500 });
      }
      
      const backendResponse = await fetchWithTimeoutAndRetry(
        chatUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, message, age }),
        },
        { timeoutMs: 30_000, retries: 2, retryDelayMs: 500 }
      );

      if (backendResponse.ok) {
        const responseData = await backendResponse.json();
        return NextResponse.json(responseData, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // Handle specific error cases
      if (backendResponse.status === 404) {
        console.error('Backend chat endpoint not found:', chatUrl);
        return NextResponse.json(
          { error: 'Chat service not found', details: 'The requested service endpoint is not available' },
          { status: 404 }
        );
      }

      // Non-OK from backend: return a clear error to the client
      const errorText = await backendResponse.text();
      console.error('Backend chat error:', backendResponse.status, errorText);
      return NextResponse.json(
        {
          error: 'Chat service is temporarily unavailable',
          details: backendResponse.status === 503 ? 'Service configuration issue' : 'Internal server error',
        },
        { status: backendResponse.status }
      );
    } catch (backendError) {
      console.error('Backend connection error:', backendError);
      return NextResponse.json(
        {
          error: 'Unable to connect to chat service',
          details: 'Please check your internet connection or try again later',
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Chat API error:', error);
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