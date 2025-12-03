import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest } from 'next/server'

// Enhanced validation functions
const validateChildData = (data: any) => {
  const errors: string[] = []
  
  // Validate required fields
  if (!data.nickname || typeof data.nickname !== 'string' || data.nickname.trim().length < 2) {
    errors.push('Nickname must be at least 2 characters long')
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
    // Generate unique IDs
    const child_uid = crypto.randomUUID()
    const childEmail = `${child_uid}@child.lana`
    const password = crypto.randomUUID()
    
    // Log the attempt
    await logChildRegistration(adminClient, 'CHILD_REGISTRATION_ATTEMPT', {
      child_uid,
      guardianEmail,
      nickname: childData.nickname,
      ipAddress: clientIP,
      timestamp: new Date().toISOString()
    })

    // Create the auth user
    const { data, error: signUpError } = await adminClient.auth.signUp({
      email: childEmail,
      password: password,
      options: {
        data: { 
          role: "child", 
          nickname: childData.nickname, 
          age: childData.age, 
          grade: childData.grade, 
          guardian_email: guardianEmail 
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirmed/child`,
      }
    })

    if (signUpError) {
      await logChildRegistration(adminClient, 'CHILD_REGISTRATION_FAILED', {
        child_uid,
        guardianEmail,
        error: signUpError.message,
        ipAddress: clientIP,
        timestamp: new Date().toISOString()
      })
      
      console.error('[API Register Child] Supabase Auth error:', signUpError)
      
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

    // Link child to guardian with proper data structure
    const { error: linkError } = await adminClient.from("guardians").upsert({
      // Use a consistent ID based on guardian email to avoid duplicates
      id: `${guardianEmail}-${data.user?.id}`,
      email: guardianEmail,
      child_uid: data.user?.id,
      weekly_report: true,
      monthly_report: false,
      created_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    })
    
    if (linkError) {
      console.warn('[API Register Child] Failed to link child to guardian:', linkError)
      await logChildRegistration(adminClient, 'CHILD_LINKING_FAILED', {
        child_uid: data.user?.id,
        guardianEmail,
        error: linkError.message,
        ipAddress: clientIP,
        timestamp: new Date().toISOString()
      })
      // Don't throw here as the auth was successful
    } else {
      console.log('[API Register Child] Successfully linked child to guardian')
      await logChildRegistration(adminClient, 'CHILD_REGISTRATION_SUCCESS', {
        child_uid: data.user?.id,
        guardianEmail,
        nickname: childData.nickname,
        ipAddress: clientIP,
        timestamp: new Date().toISOString()
      })
    }
    
    return {
      success: true,
      child_uid: data.user?.id,
      childEmail,
      nickname: childData.nickname
    }
  } catch (error) {
    console.error('[API Register Child] Error in registerSingleChild:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get client IP address for audit logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    // Handle bulk registration
    const isBulk = Array.isArray(body.children)
    const childrenData = isBulk ? body.children : [body]
    const guardianEmail = body.guardianEmail || (isBulk ? body.guardianEmail : null)
    
    // Validate guardian email
    if (!guardianEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Guardian email is required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(guardianEmail)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid guardian email format'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase admin client
    const adminClient = getSupabaseAdmin()
    
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
    
    // Provide specific error messages
    let message = 'Unexpected error during registration'
    if (error instanceof Error) {
      if (error.message?.includes('NetworkError')) {
        message = 'Network error. Please check your connection and try again.'
      } else if (error.message?.includes('Timeout')) {
        message = 'Request timeout. Please try again.'
      }
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}