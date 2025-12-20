import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyUserAuthentication } from '@/lib/services/authVerificationService';
import { handleServerError, createErrorResponse } from '@/lib/server-error-handler';

// Define the event structure that matches our frontend
interface TrackingEvent {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: string;
  eventType: string;
  metadata?: Record<string, any>;
  userAgent?: string;
  url?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Log request for debugging
    console.log('[API tracking] Received tracking events');
    
    const json = await request.json();
    console.log('[API tracking] Request body:', json);
    
    const { events } = json;
    
    if (!events || !Array.isArray(events)) {
      return createErrorResponse('Valid events array is required', 400);
    }
    
    // Get user session
    const supabase = getSupabaseAdmin();
    
    // Process each event
    const processedEvents = [];
    
    for (const event of events) {
      // Validate event structure
      if (!event.id || !event.userId || !event.eventType || !event.timestamp) {
        console.warn('[API tracking] Invalid event structure:', event);
        continue;
      }
      
      // Create the event record
      const eventRecord = {
        id: event.id,
        user_id: event.userId,
        session_id: event.sessionId,
        event_type: event.eventType,
        metadata: event.metadata || {},
        user_agent: event.userAgent,
        url: event.url,
        timestamp: event.timestamp
      };
      
      // Insert event into database
      const { data, error } = await supabase
        .from('user_events')
        .insert(eventRecord);
      
      if (error) {
        console.error('[API tracking] Error inserting event:', error);
        // Continue with other events even if one fails
        continue;
      }
      
      processedEvents.push(event.id);
    }
    
    console.log(`[API tracking] Processed ${processedEvents.length} events`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${processedEvents.length} events`,
        processedEvents
      }), 
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        } 
      }
    );
  } catch (error: any) {
    console.error('[API tracking] Error:', error);
    const errorResponse = handleServerError(error, `Error: ${error.message || 'Unknown error'}`);
    return createErrorResponse(errorResponse.message, 500);
  }
}

// GDPR compliance: Allow users to request deletion of their data
export async function DELETE(request: NextRequest) {
  try {
    // Get user email from request headers
    const userEmail = request.headers.get('x-user-email');
    
    if (!userEmail) {
      return createErrorResponse('User email not found in request', 400);
    }
    
    // Verify user authentication
    const authResult = await verifyUserAuthentication(userEmail);
    
    if (!authResult.isAuthenticated) {
      return createErrorResponse('User is not authenticated', 401);
    }
    
    // Get user ID
    const supabase = getSupabaseAdmin();
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();
    
    if (userError) {
      console.error('[API tracking] Error fetching user:', userError);
      const errorResponse = handleServerError(userError, 'Error fetching user data');
      return createErrorResponse(errorResponse.message, 500);
    }
    
    // Delete all tracking events for this user
    const { error: deleteError } = await supabase
      .from('user_events')
      .delete()
      .eq('user_id', userData.id);
    
    if (deleteError) {
      console.error('[API tracking] Error deleting user events:', deleteError);
      const errorResponse = handleServerError(deleteError, 'Error deleting user data');
      return createErrorResponse(errorResponse.message, 500);
    }
    
    console.log(`[API tracking] Deleted all events for user: ${userEmail}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'All tracking data deleted successfully' 
      }), 
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        } 
      }
    );
  } catch (error: any) {
    console.error('[API tracking] Error:', error);
    const errorResponse = handleServerError(error, `Error: ${error.message || 'Unknown error'}`);
    return createErrorResponse(errorResponse.message, 500);
  }
}