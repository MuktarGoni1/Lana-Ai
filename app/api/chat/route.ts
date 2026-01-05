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
    const { message, userId, age, mode } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('Chat request received:', { message: message.substring(0, 100) + '...', userId, age, mode });

    // For chat mode, we need to generate a conversational response
    // For quick mode, we route to structured lesson
    if (mode === 'chat') {
      // For chat mode, generate a simple conversational response
      // Since the backend might not have a dedicated chat endpoint,
      // we'll simulate a chat response here
      const chatResponse = {
        mode: mode,
        reply: `Hello! I'm your AI tutor. You said: "${message}". How can I help you today?`,
        conversationId: Date.now().toString(),
        timestamp: new Date().toISOString()
      };
      
      return NextResponse.json(chatResponse, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // For quick mode, we route to the structured lesson endpoint
    const backendBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
    const lessonUrl = `${backendBase.replace(/\/$/, '')}/api/structured-lesson`;
    
    // Validate backend URL
    try {
      new URL(lessonUrl);
    } catch (e) {
      console.error('Invalid backend URL:', lessonUrl);
      return NextResponse.json({ error: 'Invalid service configuration' }, { status: 500 });
    }
    
    // Prepare the payload for structured lesson
    const payload = { 
      topic: message,
      age: age 
    };
    
    try {
      const backendResponse = await fetchWithTimeoutAndRetry(
        lessonUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        { timeoutMs: 30_000, retries: 2, retryDelayMs: 500 }
      );

      if (backendResponse.ok) {
        const responseData = await backendResponse.json();
        
        // Return the response with mode information for quick mode
        // For quick mode, use introduction or the original message
        const replyText = responseData.introduction || message;
        
        return NextResponse.json({
          ...responseData,
          mode: mode,
          reply: replyText
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