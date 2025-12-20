import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyUserAuthentication } from '@/lib/services/authVerificationService';
import { handleServerError, createErrorResponse } from '@/lib/server-error-handler';

export async function POST(request: NextRequest) {
  try {
    // Log request for debugging
    console.log('[API learning-profile] Received request to save learning profile');
    
    const json = await request.json();
    console.log('[API learning-profile] Request body:', json);
    
    const { profile } = json;
    
    if (!profile) {
      return createErrorResponse('Learning profile is required', 400);
    }
    
    // Get user session
    const supabase = getSupabaseAdmin();
    
    // Get user from request headers (assuming it's passed by auth middleware)
    const userEmail = request.headers.get('x-user-email');
    
    if (!userEmail) {
      return createErrorResponse('User email not found in request', 400);
    }
    
    // Verify user authentication
    console.log('[API learning-profile] Verifying user authentication');
    const authResult = await verifyUserAuthentication(userEmail);
    console.log('[API learning-profile] Authentication result:', authResult);
    
    if (!authResult.isAuthenticated) {
      return createErrorResponse('User is not authenticated', 401);
    }
    
    // Get the user ID from the email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();
    
    if (userError) {
      console.error('[API learning-profile] Error fetching user:', userError);
      const errorResponse = handleServerError(userError, 'Error fetching user data');
      return createErrorResponse(errorResponse.message, 500);
    }
    
    // Update the user's metadata with the learning profile
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        learning_profile: profile 
      })
      .eq('id', userData.id);
    
    if (updateError) {
      console.error('[API learning-profile] Error saving learning profile:', updateError);
      const errorResponse = handleServerError(updateError, 'Error saving learning profile');
      return createErrorResponse(errorResponse.message, 500);
    }
    
    console.log('[API learning-profile] Learning profile saved successfully for user:', userEmail);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Learning profile saved successfully' 
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
    console.error('[API learning-profile] Error:', error);
    const errorResponse = handleServerError(error, `Error: ${error.message || 'Unknown error'}`);
    return createErrorResponse(errorResponse.message, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const supabase = getSupabaseAdmin();
    
    // Get user from request headers (assuming it's passed by auth middleware)
    const userEmail = request.headers.get('x-user-email');
    
    if (!userEmail) {
      return createErrorResponse('User email not found in request', 400);
    }
    
    // Verify user authentication
    console.log('[API learning-profile] Verifying user authentication for GET request');
    const authResult = await verifyUserAuthentication(userEmail);
    console.log('[API learning-profile] Authentication result:', authResult);
    
    if (!authResult.isAuthenticated) {
      return createErrorResponse('User is not authenticated', 401);
    }
    
    // Get the user ID from the email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('learning_profile')
      .eq('email', userEmail)
      .single();
    
    if (userError) {
      console.error('[API learning-profile] Error fetching user learning profile:', userError);
      const errorResponse = handleServerError(userError, 'Error fetching learning profile');
      return createErrorResponse(errorResponse.message, 500);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        profile: userData.learning_profile || null
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
    console.error('[API learning-profile] Error:', error);
    const errorResponse = handleServerError(error, `Error: ${error.message || 'Unknown error'}`);
    return createErrorResponse(errorResponse.message, 500);
  }
}