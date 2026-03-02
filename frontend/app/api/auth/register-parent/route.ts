import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest } from 'next/server'
import serverRateLimiter from '@/lib/server-rate-limiter'
import { validateCSRFToken } from '@/lib/security/csrf-server'
// For now, we'll implement basic sanitization manually since dompurify import is problematic

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await serverRateLimiter.isAllowed('/api/auth/register-parent', ip);
    
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
    if (!csrfToken || !(await validateCSRFToken(csrfToken))) {
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
    
    const body = await request.json();
    const { email, password } = body;
    
    // Enhanced input validation
    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Email is required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (password) {
      // Strong password validation
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return new Response(
          JSON.stringify({
            success: false,
            message: passwordValidation.error
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Email is required'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Enhanced email validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          message: emailValidation.error
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Basic sanitization
    const sanitizedEmail = email.trim().toLowerCase().replace(/[^a-zA-Z0-9@._-]/g, '');

    try {
      // Initialize Supabase admin client
      const adminClient = getSupabaseAdmin()

      // Create or update guardian settings row
      const { error: insertError } = await adminClient.from("guardian_settings").upsert({
        email: sanitizedEmail,
        weekly_report: true,
        monthly_report: false,
      }, { onConflict: 'email' })
      
      if (insertError) {
        console.warn('[API Register Parent] Failed to create guardian settings record:', insertError)
        // Don't throw here as we still want to proceed with authentication
      } else {
        console.log('[API Register Parent] Successfully created guardian settings record')
      }

      // Sign in with OTP (this will send the magic link)
      const { data, error } = await adminClient.auth.signInWithOtp({
        email: sanitizedEmail,
        options: {
          data: { role: "parent" }, // Changed from "guardian" to "parent"
          emailRedirectTo: 'https://www.lanamind.com/auth/auto-login',
        },
      })

      if (error) {
        console.error('[API Register Parent] Supabase Auth error:', error)
        
        // Try to provide more specific error messages
        let message = 'Failed to send magic link';
        if (error.message?.includes('Email rate limit exceeded')) {
          message = 'Too many requests. Please wait before trying again.';
        } else if (error.message?.includes('Invalid email')) {
          message = 'Invalid email address provided.';
        }
        
        return new Response(
          JSON.stringify({
            success: false,
            message
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }

      // After successful sign-up, create a profile record in the new profiles table
      if (data && (data as any).user?.id) {
        const userData = (data as any).user;
        const profileInsert = await adminClient.from('profiles').upsert({
          id: userData.id,
          full_name: userData.email?.split('@')[0] || '', // Use email prefix as full_name
          role: 'parent',
          parent_id: null, // Parents have no parent_id
          diagnostic_completed: false, // Parents don't need diagnostics
          is_active: true
        }, { onConflict: 'id' });
        
        if (profileInsert.error) {
          console.error('[API Register Parent] Failed to create profile record:', profileInsert.error);
        } else {
          console.log('[API Register Parent] Successfully created profile record for parent');
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Magic link sent successfully. Please check your email.',
          data
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    } catch (error: any) {
      console.error('[API Register Parent] Unexpected error:', error)
      
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
  } catch (error: any) {
    console.error('[API Register Parent] Request parsing error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Invalid request format'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Password validation function
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password must be less than 128 characters' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character (@$!%*?&)' };
  }
  
  return { valid: true };
}

// Enhanced email validation function
function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  
  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }
  
  // RFC 5322 compliant regex (simplified but secure)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true };
}
