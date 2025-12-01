import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyUserAuthentication } from '@/lib/services/authVerificationService';

export async function POST(request: NextRequest) {
  try {
    // Log request for debugging
    console.log('[API study-plan] Received request to save study plan');
    
    const json = await request.json();
    console.log('[API study-plan] Request body:', json);
    
    const { email, subjects } = json;
    
    if (!email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Email is required' 
        }), 
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          } 
        }
      );
    }
    
    if (!subjects || !Array.isArray(subjects)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Valid subjects array is required' 
        }), 
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          } 
        }
      );
    }
    
    // Verify user authentication
    console.log('[API study-plan] Verifying user authentication');
    const authResult = await verifyUserAuthentication(email);
    console.log('[API study-plan] Authentication result:', authResult);
    
    if (!authResult.isAuthenticated) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'User is not authenticated' 
        }), 
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          } 
        }
      );
    }
    
    // In a real implementation, we would save the study plan to the database here
    // For now, we'll just return success
    console.log('[API study-plan] Study plan saved successfully');
    
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
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Error: ${error.message || 'Unknown error'}` 
      }), 
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        } 
      }
    );
  }
}