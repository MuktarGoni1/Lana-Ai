import { NextResponse } from 'next/server';

function getAuthHeader() {
  const apiKey = process.env.DID_API_KEY;
  if (!apiKey) throw new Error('Missing DID_API_KEY');
  const base64 = Buffer.from(apiKey).toString('base64');
  return `Basic ${base64}`;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { answer, sessionId } = body || {};
    if (!id || !answer) {
      return NextResponse.json({ error: 'Missing id or answer' }, { status: 400 });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
      Accept: 'application/json',
    };
    if (sessionId) {
      headers['Cookie'] = `AWSALB=${sessionId}`; // best effort; legacy talks streams also accept session_id in body
    }

    const res = await fetch(`https://api.d-id.com/talks/streams/${id}/sdp`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ answer, session_id: sessionId }),
    });

    const text = await res.text();
    
    interface DIdResponse {
      error?: string;
    }
    
    let json: DIdResponse | null = null;
    try { 
      const parsed = JSON.parse(text);
      json = typeof parsed === 'object' && parsed !== null ? parsed : null;
    } catch {}

    if (!res.ok) {
      return NextResponse.json({ error: json?.error || text || 'D-ID SDP submit failed' }, { status: res.status });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 });
  }
}