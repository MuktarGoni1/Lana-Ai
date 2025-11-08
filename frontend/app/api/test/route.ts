import { NextResponse } from 'next/server'

export async function GET() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://lana-ai.onrender.com";
  
  try {
    // Test the connection to the backend
    const response = await fetch(`${API_BASE}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        message: 'Connected to backend successfully',
        apiBase: API_BASE,
        status: response.status
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Backend responded with error status',
        apiBase: API_BASE,
        status: response.status
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to connect to backend',
      apiBase: API_BASE,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}