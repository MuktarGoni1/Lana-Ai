import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }
    
    // Delete the D-ID stream
    const response = await fetch(`https://api.d-id.com/talks/streams/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.DID_API_KEY || '').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_id: sessionId })
    });
    
    if (!response.ok) {
      console.error('D-ID delete stream error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to delete stream' },
        { status: response.status }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Stream deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}