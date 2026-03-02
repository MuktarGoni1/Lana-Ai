import { NextResponse } from 'next/server';
import { fetchWithTimeoutAndRetry } from '@/lib/utils';
import rateLimiter from '@/lib/rate-limiter';
import serverRateLimiter from '@/lib/server-rate-limiter';

const STRUCTURED_LESSON_URL = 'https://api.lanamind.com/api/structured-lesson';

export async function POST(req: Request) {
  try {
    const endpoint = '/api/structured-lesson/stream';
    if (!rateLimiter.isAllowed(endpoint)) {
      const timeUntilReset = rateLimiter.getTimeUntilNextRequest(endpoint);
      const secondsUntilReset = Math.ceil(timeUntilReset / 1000);

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${secondsUntilReset} seconds.`,
          retryAfter: secondsUntilReset,
        },
        { status: 429 }
      );
    }

    const serverRateLimitCheck = await serverRateLimiter.isAllowedSimple(
      endpoint,
      req.headers.get('x-forwarded-for') || 'unknown'
    );
    if (!serverRateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${serverRateLimitCheck.retryAfter} seconds.`,
          retryAfter: serverRateLimitCheck.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': serverRateLimitCheck.retryAfter?.toString() || '60',
          },
        }
      );
    }

    const body = await req.json();
    const { topic, age } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const backendResponse = await fetchWithTimeoutAndRetry(
      STRUCTURED_LESSON_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, age }),
      },
      { timeoutMs: 30_000, retries: 2, retryDelayMs: 500 }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return NextResponse.json(
        {
          error: 'Structured lesson service is temporarily unavailable',
          details: errorText.slice(0, 500),
        },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Structured lesson API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
