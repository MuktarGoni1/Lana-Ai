import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyUserAuthentication } from '@/lib/services/authVerificationService';
import { handleServerError, createErrorResponse } from '@/lib/server-error-handler';

export async function POST(request: NextRequest) {
  try {
    // Log request for debugging
    console.log('[API study-plan] Received request to save study plan');
    
    const json = await request.json();
    console.log('[API study-plan] Request body:', json);
    
    const { email, subjects } = json;
    
    if (!email) {
      return createErrorResponse('Email is required', 400);
    }
    
    if (!subjects || !Array.isArray(subjects)) {
      return createErrorResponse('Valid subjects array is required', 400);
    }
    
    // Verify user authentication
    console.log('[API study-plan] Verifying user authentication');
    const authResult = await verifyUserAuthentication(email);
    console.log('[API study-plan] Authentication result:', authResult);
    
    if (!authResult.isAuthenticated) {
      return createErrorResponse('User is not authenticated', 401);
    }
    
    // Save the study plan to the database
    const supabase = getSupabaseAdmin();
    
    // Since there's no dedicated table for study plans in the schema,
    // we'll store the subjects and topics in the user's metadata
    // First, get the user ID from the email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError) {
      console.error('[API study-plan] Error fetching user:', userError);
      const errorResponse = handleServerError(userError, 'Error fetching user data');
      return createErrorResponse(errorResponse.message, 500);
    }
    
    // Update the user's metadata with the study plan
    // Note: We're storing the study plan directly in the user record
    // In a real implementation, you might want a separate table for study plans
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        study_plan: subjects 
      })
      .eq('id', userData.id);
    
    if (updateError) {
      console.error('[API study-plan] Error saving study plan:', updateError);
      const errorResponse = handleServerError(updateError, 'Error saving study plan');
      return createErrorResponse(errorResponse.message, 500);
    }
    
    console.log('[API study-plan] Study plan saved successfully for user:', email);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Study plan saved successfully' 
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
    console.error('[API study-plan] Error:', error);
    const errorResponse = handleServerError(error, `Error: ${error.message || 'Unknown error'}`);
    return createErrorResponse(errorResponse.message, 500);
  }
}