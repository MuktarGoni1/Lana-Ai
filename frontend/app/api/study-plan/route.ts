import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { handleServerError, createErrorResponse } from '@/lib/server-error-handler';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { subjects } = json;
    
    if (!subjects || !Array.isArray(subjects)) {
      return createErrorResponse('Valid subjects array is required', 400);
    }
    
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        study_plan: subjects 
      })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('[API study-plan] Error saving study plan:', updateError);
      const errorResponse = handleServerError(updateError, 'Error saving study plan');
      return createErrorResponse(errorResponse.message, 500);
    }
    
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
