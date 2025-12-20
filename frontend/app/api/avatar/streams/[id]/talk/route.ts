import { NextResponse } from 'next/server';
import { fetchWithTimeoutAndRetry } from '../../../../../../lib/utils';

function getAuthHeader() {
  const apiKey = process.env.DID_API_KEY;
  if (!apiKey) throw new Error('Missing DID_API_KEY');
  const base64 = Buffer.from(apiKey).toString('base64');
  return `Basic ${base64}`;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { text, sessionId, voiceId, providerType } = body || {};
    if (!id || !text) {
      return NextResponse.json({ error: 'Missing id or text' }, { status: 400 });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
      Accept: 'application/json',
    };
    if (sessionId) headers['Cookie'] = `AWSALB=${sessionId}`;

    interface Script {
      type: string;
      input: string;
      provider: {
        type: string;
        voice_id: string;
      };
    }

    interface Payload {
      script: Script;
      config: { fluent: boolean; pad_audio: number };
      audio_optimization: string;
      session_id?: string;
    }

    const payload: Payload = {
      script: {
        type: 'text',
        input: text,
        provider: {
          type: providerType || 'microsoft',
          voice_id: voiceId || 'en-US-JennyNeural',
        },
      },
      config: { fluent: true, pad_audio: 0 },
      audio_optimization: '2',
      session_id: sessionId,
    };

    const res = await fetchWithTimeoutAndRetry(`https://api.d-id.com/talks/streams/${id}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    }, { timeoutMs: 10_000, retries: 2, retryDelayMs: 300 });

    const textRes = await res.text();
    
    interface DIdResponse {
      error?: string;
    }
    
    let json: DIdResponse | null = null;
    try { 
      const parsed = JSON.parse(textRes);
      json = typeof parsed === 'object' && parsed !== null ? parsed : null;
    } catch {}

    if (!res.ok) {
      return NextResponse.json({ error: json?.error || textRes || 'D-ID talk submit failed' }, { status: res.status });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 });
  }
}