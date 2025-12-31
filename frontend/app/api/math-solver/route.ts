import { NextResponse } from 'next/server';
import { fetchWithTimeoutAndRetry } from '@/lib/utils';
import rateLimiter from '@/lib/rate-limiter';

export async function POST(req: Request) {
  try {
    // Check rate limiting
    const endpoint = '/api/math-solver/solve';
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
    const { problem, show_steps } = body;

    if (!problem) {
      return NextResponse.json({ error: 'Problem is required' }, { status: 400 });
    }

    // Log the request for debugging
    console.log('Math solver request received:', { problem: problem.substring(0, 100) + '...', show_steps });

    // Proxy the request to the backend service
    try {
      const backendBase = process.env.NEXT_PUBLIC_API_BASE || 'https://api.lanamind.com';
      const mathSolverUrl = `${backendBase.replace(/\/$/, '')}/api/math-solver/solve`;
      
      // Validate backend URL
      try {
        new URL(mathSolverUrl);
      } catch (e) {
        console.error('Invalid backend URL:', mathSolverUrl);
        return NextResponse.json({ error: 'Invalid service configuration' }, { status: 500 });
      }
      
      const backendResponse = await fetchWithTimeoutAndRetry(
        mathSolverUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problem, show_steps }),
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
        console.error('Backend math solver endpoint not found:', mathSolverUrl);
        return NextResponse.json(
          { error: 'Math solver service not found', details: 'The requested service endpoint is not available' },
          { status: 404 }
        );
      }

      // Non-OK from backend: return a clear error to the client
      const errorText = await backendResponse.text();
      console.error('Backend math solver error:', backendResponse.status, errorText);
      return NextResponse.json(
        {
          error: 'Math solver service is temporarily unavailable',
          details: backendResponse.status === 503 ? 'Service configuration issue' : 'Internal server error',
        },
        { status: backendResponse.status }
      );
    } catch (backendError) {
      console.error('Backend connection error:', backendError);
      return NextResponse.json(
        {
          error: 'Unable to connect to math solver service',
          details: 'Please check your internet connection or try again later',
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Math solver API error:', error);
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