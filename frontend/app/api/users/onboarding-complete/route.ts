import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyUserAuthentication } from '@/lib/services/authVerificationService';
import { handleServerError, createErrorResponse } from '@/lib/server-error-handler';

export async function POST(request: NextRequest) {
  try {
    console.log('[API onboarding-complete] Received request to update onboarding status');
    
    const { userId, email } = await request.json();
    
    if (!email) {
      return createErrorResponse('Email is required', 400);
    }
    
    // Verify user authentication
    console.log('[API onboarding-complete] Verifying user authentication for email:', email);
    const authResult = await verifyUserAuthentication(email);
    console.log('[API onboarding-complete] Authentication result:', authResult);
    
    if (!authResult.isAuthenticated) {
      return createErrorResponse('User is not authenticated', 401);
    }
    
    // Get the admin client
    const supabase = getSupabaseAdmin();
    
    // Update the user's metadata to mark onboarding as complete
    const { error } = await supabase.auth.admin.updateUserById(authResult.user.id, {
      user_metadata: {
        onboarding_complete: true,
      },
    });

    if (error) {
      console.error('Error updating onboarding status:', error);
      const errorResponse = handleServerError(error, 'Error updating onboarding status');
      return createErrorResponse(errorResponse.message, 500);
    }

    console.log('[API onboarding-complete] Onboarding status updated successfully for user:', email);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Onboarding status updated successfully' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[API onboarding-complete] Error:', error);
    const errorResponse = handleServerError(error, `Error: ${error.message || 'Unknown error'}`);
    return createErrorResponse(errorResponse.message, 500);
  }
}