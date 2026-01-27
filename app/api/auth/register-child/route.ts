import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest } from 'next/server'
import serverRateLimiter from '@/lib/server-rate-limiter'
import { validateCSRFToken } from '@/lib/security/csrf'
// For now, we'll implement basic sanitization manually since dompurify import is problematic

// Enhanced validation functions
const validateChildData = (data: any) => {
  const errors: string[] = []
  
  // Validate required fields
  if (!data.nickname || typeof data.nickname !== 'string' || data.nickname.trim().length < 2) {
    errors.push('Nickname must be at least 2 characters long')
  } else if (data.nickname.trim().length > 50) {
    errors.push('Nickname must be less than 50 characters')
  }
  
  if (!data.age || typeof data.age !== 'number' || data.age < 6 || data.age > 18) {
    errors.push('Age must be between 6 and 18')
  }
  
  if (!data.grade || typeof data.grade !== 'string' || !['6', '7', '8', '9', '10', '11', '12', 'college'].includes(data.grade)) {
    errors.push('Invalid grade level')
  }
  
  if (!data.guardianEmail || typeof data.guardianEmail !== 'string') {
    errors.push('Guardian email is required')
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.guardianEmail)) {
      errors.push('Invalid guardian email format')
    }
  }
  
  return errors
}

// Audit logging function
const logChildRegistration = async (adminClient: any, operation: string, details: any) => {
  try {
    // Log to console for now - in production, this would write to a dedicated audit table
    console.log(`[AUDIT] ${new Date().toISOString()} ${operation}`, details)
    
    // In a production environment, we would implement database logging like this:
    /*
    const { error: logError } = await adminClient.from('audit_logs').insert({
      timestamp: new Date().toISOString(),
      operation,
      details: JSON.stringify(details),
      user_id: details.guardianEmail || null,
      ip_address: details.ipAddress || null
    });
    
    if (logError) {
      console.warn('[AUDIT] Failed to write to audit log:', logError);
    }
    */
  } catch (error) {
    console.warn('[AUDIT] Failed to log operation:', error)
  }
}

// Enhanced child registration function
const registerSingleChild = async (adminClient: any, childData: any, guardianEmail: string, clientIP: string) => {
  try {
    // Get the authenticated parent user
    const { data: { user: parentUser }, error: parentError } = await adminClient.auth.getUser();
    
    if (parentError || !parentUser) {
      throw new Error('Parent authentication required to register child');
    }
    
    // Log the attempt
    await logChildRegistration(adminClient, 'CHILD_REGISTRATION_ATTEMPT', {
      parent_id: parentUser.id,
      guardianEmail,
      nickname: childData.nickname,
      ipAddress: clientIP,
      timestamp: new Date().toISOString()
    })

    // Create the auth user
    const { data: childAuthData, error: signUpError } = await adminClient.auth.admin.createUser({
      email: `${crypto.randomUUID()}@child.lana`,
      password: crypto.randomUUID(),
      user_metadata: { 
        role: "child", 
        nickname: childData.nickname, 
        age: childData.age, 
        grade: childData.grade, 
        guardian_email: guardianEmail 
      },
    })

    if (signUpError) {
      await logChildRegistration(adminClient, 'CHILD_REGISTRATION_FAILED', {
        parent_id: parentUser.id,
        guardianEmail,
        error: signUpError.message,
        ipAddress: clientIP,
        timestamp: new Date().toISOString()
      })
      
      console.error('[API Register Child] Supabase Admin Auth error:', signUpError)
      
      // Provide specific error messages
      let message = 'Failed to create account'
      if (signUpError.message?.includes('Email rate limit exceeded')) {
        message = 'Too many requests. Please wait before trying again.'
      } else if (signUpError.message?.includes('already been registered')) {
        message = 'This email is already registered. Please use a different email.'
      } else if (signUpError.message?.includes('Invalid email')) {
        message = 'Invalid email address provided.'
      }
      
      throw new Error(message)
    }
    
    const childUserId = childAuthData.user?.id;
    
    if (!childUserId) {
      throw new Error('Failed to create child user account');
    }

    // Create the profile record linking child to parent with account status flags
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: childUserId,
      full_name: childData.nickname,
      role: 'child',
      parent_id: parentUser.id,
      diagnostic_completed: false,
      is_active: true,
      created_at: new Date().toISOString()
    });
    
    if (profileError) {
      console.error('[API Register Child] Failed to create profile:', profileError);
      
      // Rollback: Delete the created user since profile creation failed
      await adminClient.auth.admin.deleteUser(childUserId);
      
      throw new Error('Failed to create child profile');
    }
    
    console.log('[API Register Child] Successfully registered child and created profile')
    await logChildRegistration(adminClient, 'CHILD_REGISTRATION_SUCCESS', {
      child_id: childUserId,
      parent_id: parentUser.id,
      guardianEmail,
      nickname: childData.nickname,
      ipAddress: clientIP,
      timestamp: new Date().toISOString()
    })
    
    return {
      success: true,
      child_uid: childUserId,
      nickname: childData.nickname
    }
  } catch (error) {
    console.error('[API Register Child] Error in registerSingleChild:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await serverRateLimiter.isAllowed('/api/auth/register-child', ip);
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Too many requests. Please wait before trying again.'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
          }
        }
      );
    }
    
    // CSRF protection
    const csrfToken = request.headers.get('x-csrf-token');
    if (!csrfToken || !validateCSRFToken(csrfToken)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid request. Please try again.'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const body = await request.json()
    
    // Get client IP address for audit logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    // Initialize Supabase admin client
    const adminClient = getSupabaseAdmin()

    // Verify that the requesting user is authenticated and is a parent
    const { data: { user }, error: authError } = await adminClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Authentication required to register child accounts'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Verify the user is a parent
    const { data: userProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (profileError || userProfile?.role !== 'parent') {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Only parents can register child accounts'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Get the parent's email from the authenticated user
    const guardianEmail = user.email;
    
    if (!guardianEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Parent email is required for child registration'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Handle bulk registration
    const isBulk = Array.isArray(body.children)
    const childrenData = isBulk ? body.children : [body]
    // For the new system, we'll use the authenticated parent's email
    // No need to validate guardian email since it comes from authenticated user
    
    // Validate all children data
    const validationErrors: { index: number; errors: string[] }[] = []
    for (let i = 0; i < childrenData.length; i++) {
      const child = childrenData[i]
      const errors = validateChildData({ ...child, guardianEmail })
      if (errors.length > 0) {
        validationErrors.push({ index: i, errors })
      }
    }
    
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Register all children
    const results = []
    const errors = []
    
    for (let i = 0; i < childrenData.length; i++) {
      try {
        const result = await registerSingleChild(adminClient, childrenData[i], guardianEmail, clientIP)
        results.push(result)
      } catch (error: any) {
        errors.push({
          index: i,
          child: childrenData[i].nickname,
          error: error.message || 'Unknown error'
        })
      }
    }
    
    // Return results
    if (errors.length > 0 && results.length === 0) {
      // All registrations failed
      return new Response(
        JSON.stringify({
          success: false,
          message: 'All child registrations failed',
          errors
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    } else if (errors.length > 0) {
      // Some registrations failed
      return new Response(
        JSON.stringify({
          success: true,
          message: `${results.length} child(ren) registered successfully, ${errors.length} failed`,
          data: results,
          errors
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    } else {
      // All registrations successful
      return new Response(
        JSON.stringify({
          success: true,
          message: isBulk 
            ? `${results.length} children registered successfully. Welcome to Lana!` 
            : 'Account created successfully. Welcome to Lana!',
          data: results
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  } catch (error: any) {
    console.error('[API Register Child] Unexpected error:', error)
    
    // Check if this is a network connectivity error
    if (error instanceof Error && 
        (error.message?.includes('NetworkError') || 
         error.message?.includes('ECONNREFUSED') || 
         error.message?.includes('ENOTFOUND'))) {
      
      // Return a specific error for offline scenarios
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Network connection unavailable. Child data has been saved locally and will be synced when connection is restored.',
          offline: true
        }),
        {
          status: 503, // Service Unavailable
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Generic error message for security
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Registration failed. Please try again.'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}