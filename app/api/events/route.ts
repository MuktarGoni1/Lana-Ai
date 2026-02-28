// app/api/events/route.ts
// API route to handle user events logging

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { TablesInsert } from '@/types/supabase';

interface UserEvent extends TablesInsert<'user_events'> {
  session_id?: string;
  event_type: string;
  metadata?: Record<string, any>;
  user_agent?: string;
  url?: string;
  ip_address?: string;
  user_id?: string;
}

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    const body: UserEvent = await req.json();
    
    // Validate required fields
    if (!body.event_type) {
      return NextResponse.json(
        { error: 'event_type is required' },
        { status: 400 }
      );
    }
    
    // user_events.user_id is NOT NULL + FK to auth.users in the target schema.
    // We only allow authenticated event writes in this route.
    const userId = session?.user?.id || body.user_id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required to log events' },
        { status: 401 }
      );
    }
    
    // Insert the event into the user_events table
    const { error } = await supabase
      .from('user_events')
      .insert([{
        session_id: body.session_id,
        event_type: body.event_type,
        metadata: body.metadata || {},
        user_agent: body.user_agent,
        url: body.url,
        ip_address: body.ip_address,
        user_id: userId,
        timestamp: new Date().toISOString(),
      }]);
    
    if (error) {
      console.error('Error inserting user event:', error);
      return NextResponse.json(
        { error: 'Failed to log event' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Event logged successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in events API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
