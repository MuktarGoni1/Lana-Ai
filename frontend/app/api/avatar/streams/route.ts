import { NextResponse } from 'next/server';
import { fetchWithTimeoutAndRetry } from '@/lib/utils';

function getAuthHeader() {
  const apiKey = process.env.DID_API_KEY;
  if (!apiKey) throw new Error('Missing DID_API_KEY');
  const base64 = Buffer.from(apiKey).toString('base64');
  return `Basic ${base64}`;
}

function extractAwsAlbCookie(setCookieHeader?: string | null) {
  if (!setCookieHeader) return null;
  // Try to find AWSALB or AWSALBAPP cookie value
  const match = setCookieHeader.match(/AWSALB(APP)?=([^;]+)/);
  return match ? match[2] : null;
}

interface Payload {
  audio: string;
  voice: string;
  mouth: string;
  gender: string;
  pitch: string;
  speed: string;
  text: string;
  session_id: string;
  stream_id: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const sourceUrl = body?.sourceImageUrl || process.env.DID_SOURCE_IMAGE_URL;
    if (!sourceUrl) {
      return NextResponse.json({ error: 'Missing DID_SOURCE_IMAGE_URL' }, { status: 400 });
    }

    interface Payload {
      source_url: string;
      compatibility_mode: string;
      stream_warmup: boolean;
      output_resolution: number;
      config: { stitch: boolean };
    }

    const payload: Payload = {
      source_url: sourceUrl,
      compatibility_mode: 'on',
      stream_warmup: true,
      output_resolution: 512,
      // Optional face/config tuning — safe defaults
      config: { stitch: true },
    };

    const res = await fetchWithTimeoutAndRetry('https://api.d-id.com/talks/streams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(),
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    }, { timeoutMs: 10_000, retries: 2, retryDelayMs: 300 });

    const text = await res.text();
    
    interface DIdResponse {
      session_id?: string;
      id?: string;
      offer?: string;
      ice_servers?: string[];
      error?: string;
    }
    
    let json: DIdResponse | null = null;
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'object' && parsed !== null) {
        json = parsed as DIdResponse;
      } else {
        throw new Error('Invalid JSON response format');
      }
    } catch (e) {
      console.error('Failed to parse D-ID response or invalid format:', e);
      json = null;
    }

    if (!res.ok) {
      return NextResponse.json({ error: json?.error || text || 'D-ID stream create failed' }, { status: res.status });
    }

    const setCookie = res.headers.get('set-cookie');
    const sessionId = json?.session_id || extractAwsAlbCookie(setCookie);

    return NextResponse.json({
      id: json?.id,
      offer: json?.offer,
      iceServers: json?.ice_servers || [],
      sessionId,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 });
  }
}
