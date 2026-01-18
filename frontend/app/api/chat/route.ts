import { NextResponse } from 'next/server';
import { fetchWithTimeoutAndRetry } from '@/lib/utils';
import rateLimiter from '@/lib/rate-limiter';
import serverRateLimiter from '@/lib/server-rate-limiter';

export async function POST(req: Request) {
  try {
    // Check client-side rate limiting (still useful for UX)
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
    
    // Check server-side rate limiting (primary defense)
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
    const { message, userId, age, mode } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    // Validate that the mode is supported
    const SUPPORTED_MODES = ['chat', 'quick', 'lesson', 'maths'];
    if (!SUPPORTED_MODES.includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode. Supported modes: chat, quick, lesson, maths' }, { status: 400 });
    }

    // Define backend base URL for configurable API endpoints
    const backendBase = process.env.NEXT_PUBLIC_API_BASE || 'https://api.lanamind.com';
    
    console.log('Chat request received:', { message: message.substring(0, 100) + '...', userId, age, mode });

    // For chat mode, we need to generate a conversational response
    // For quick mode, we route to configurable quick mode endpoint
    if (mode === 'chat') {
      // For chat mode, generate a conversational response by calling the configurable AI service
      const chatUrl = `${backendBase.replace(/\/$/, '')}/api/chat/`;
      
      // The production URL is hardcoded and assumed to be valid
      
      // Prepare the payload for the production chat API (exact backend format)
      const payload = { 
        user_id: userId,
        message: message,
        age: age
      };
      
      try {
        const backendResponse = await fetchWithTimeoutAndRetry(
          chatUrl,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': 'Lana-Frontend/1.0'
            },
            body: JSON.stringify(payload),
          },
          { timeoutMs: 30_000, retries: 2, retryDelayMs: 500 }
        );

        if (backendResponse.ok) {
          const responseData = await backendResponse.json();
          
          // Return the response with mode information for chat mode
          // The production API should return a proper chat response
          const replyText = responseData.reply || responseData.message || JSON.stringify(responseData);
          
          return NextResponse.json({
            mode: mode,
            reply: replyText,
            ...responseData,
            conversationId: Date.now().toString(),
            timestamp: new Date().toISOString()
          }, {
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
        console.error('Backend chat service error:', backendResponse.status, errorText);
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
    }
    
    // For quick mode, we route to the configurable quick mode endpoint
    const lessonUrl = `${backendBase.replace(/\/$/, '')}/api/quick/generate`;
    
    // Prepare the payload for the production quick mode API
    const payload = { 
      topic: message,
      age: age
    };
    
    try {
      const backendResponse = await fetchWithTimeoutAndRetry(
        lessonUrl,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Lana-Frontend/1.0'
          },
          body: JSON.stringify(payload),
        },
        { timeoutMs: 30_000, retries: 2, retryDelayMs: 500 }
      );

      if (backendResponse.ok) {
        const responseData = await backendResponse.json();
        
        // For quick mode, return the full response from the quick mode endpoint
        // The quick mode endpoint already returns a properly formatted concise response
        return NextResponse.json({
          ...responseData,
          mode: mode,
          reply: responseData.introduction || message
        }, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // Handle specific error cases
      if (backendResponse.status === 404) {
        console.error('Backend structured lesson endpoint not found:', lessonUrl);
        return NextResponse.json(
          { error: 'Lesson service not found', details: 'The requested service endpoint is not available' },
          { status: 404 }
        );
      }

      // Non-OK from backend: return a clear error to the client
      const errorText = await backendResponse.text();
      console.error('Backend lesson service error:', backendResponse.status, errorText);
      return NextResponse.json(
        {
          error: 'Lesson service is temporarily unavailable',
          details: backendResponse.status === 503 ? 'Service configuration issue' : 'Internal server error',
        },
        { status: backendResponse.status }
      );
    } catch (backendError) {
      console.error('Backend connection error:', backendError);
      return NextResponse.json(
        {
          error: 'Unable to connect to lesson service',
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