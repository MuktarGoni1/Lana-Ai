import { NextResponse } from 'next/server';
import { fetchWithTimeoutAndRetry } from '@/lib/utils';

export async function GET() {
  try {
    // Check if D-ID API key is configured
    const apiKey = process.env.DID_API_KEY;
    const sourceUrl = process.env.DID_SOURCE_IMAGE_URL;
    
    if (!apiKey || !sourceUrl) {
      return NextResponse.json({ 
        status: 'unavailable',
        reason: 'Missing D-ID configuration',
        hasApiKey: !!apiKey,
        hasSourceUrl: !!sourceUrl
      }, { status: 503 });
    }

    // Test D-ID API connectivity
    const base64 = Buffer.from(apiKey).toString('base64');
    const authHeader = `Basic ${base64}`;
    
    const response = await fetchWithTimeoutAndRetry('https://api.d-id.com/talks/streams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        source_url: sourceUrl,
        compatibility_mode: 'on',
        stream_warmup: true,
        output_resolution: 512,
      }),
    }, { timeoutMs: 8_000, retries: 1, retryDelayMs: 300 });

    if (!response.ok) {
      return NextResponse.json({ 
        status: 'unavailable',
        reason: 'D-ID API error',
        statusCode: response.status
      }, { status: 503 });
    }

    return NextResponse.json({ 
      status: 'available',
      message: 'D-ID API is accessible'
    });
    
  } catch (error) {
    return NextResponse.json({ 
      status: 'unavailable',
      reason: 'Network error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}