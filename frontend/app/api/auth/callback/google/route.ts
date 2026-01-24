import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  console.log('[Google OAuth Callback] Received request:', request.url);
  
  // Parse the URL to extract both search params and handle potential fragment-style params
  const url = new URL(request.url);
  
  // Handle development environment where origin might be 0.0.0.0
  let redirectOrigin = url.origin;
  if (url.hostname === '0.0.0.0' || url.hostname === 'localhost') {
    // Use the production domain or localhost with proper port in development
    redirectOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lanamind.com';
    console.log('[Google OAuth Callback] Using production origin for redirect:', redirectOrigin);
  }
  
  // Log the incoming URL structure for debugging
  console.log('[Google OAuth Callback] URL breakdown:', {
    origin: url.origin,
    redirectOrigin: redirectOrigin,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    fullUrl: request.url
  });
  
  // First, try to get code from search parameters (standard query string)
  let code = url.searchParams.get('code');
  const next = url.searchParams.get('next');
  
  // If no code in search params, check if we have a fragment that might contain the parameters
  // This handles the case where the OAuth flow places parameters in the fragment (after #)
  if (!code && url.hash) {
    console.log('[Google OAuth Callback] Checking fragment for code parameter');
    // Extract code from fragment if it exists (e.g., #access_token=...&code=...)
    const fragmentParams = new URLSearchParams(url.hash.substring(1)); // Remove the #
    code = fragmentParams.get('code');
    
    // Log what we found in the fragment
    console.log('[Google OAuth Callback] Fragment parameters:', Object.fromEntries(fragmentParams));
  }
  
  // Additional check: Sometimes the entire OAuth response might be in the search params
  // but with a malformed structure
  if (!code) {
    console.log('[Google OAuth Callback] No code found, checking for alternative parameter locations');
    // Check if there are any OAuth-related parameters in unexpected locations
    const allParams = new URLSearchParams(url.search);
    for (const [key, value] of allParams.entries()) {
      if (key.includes('code') && value && value.length > 10) {
        code = value;
        console.log(`[Google OAuth Callback] Found code in parameter '${key}':`, code.substring(0, 20) + '...');
        break;
      }
    }
  }
  
  // If there's an error in the params, handle it
  const error = url.searchParams.get('error');
  if (error) {
    console.error('Google OAuth error:', error);
    // Redirect to login with error message
    const errorRedirect = new URL(`${redirectOrigin}/login`);
    errorRedirect.searchParams.set('error', 'Google authentication failed');
    return NextResponse.redirect(errorRedirect);
  }

  if (code) {
    try {
      const supabase = await createServerClient();
      
      // Exchange the authorization code for a session using Supabase's built-in method
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        console.log('Attempting to get user directly from session instead...');
        
        // If code exchange fails, try to get user directly (session might already be established)
        const { data: { user: directUser }, error: directUserError } = await supabase.auth.getUser();
        
        if (directUserError || !directUser) {
          console.error('Error getting user after failed code exchange:', directUserError?.message || 'No user returned');
          const errorRedirect = new URL(`${redirectOrigin}/login`);
          errorRedirect.searchParams.set('error', 'Failed to authenticate user');
          return NextResponse.redirect(errorRedirect);
        }
        
        // Use the directly obtained user
        const user = directUser;
        
        // Check if user profile already exists
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (existingProfile) {
          // Update existing profile with latest Google info if available
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);
            
          if (updateError) {
            console.error('Error updating existing profile:', updateError);
          }
        } else {
          // Create new user profile with guardian role by default
          // Get user metadata to extract Google info
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
          
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: fullName,
              avatar_url: user.user_metadata?.avatar_url,
              google_id: user.user_metadata?.sub, // Google's user ID
              role: 'guardian', // Default to guardian role for Google signups
              parent_id: null, // Parents have no parent_id
              onboarding_complete: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            
          if (insertError) {
            console.error('Error creating profile:', insertError);
          }
        }
        
        // Create/update guardian record to link the parent account
        const { error: guardianUpdateError } = await supabase
          .from('guardians')
          .upsert({
            email: user.email,
            weekly_report: true,
            monthly_report: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email' });

        if (guardianUpdateError) {
          console.warn('Warning: Failed to update guardian record:', guardianUpdateError);
        }
        
        // Check if user has completed onboarding
        const { data: profileData } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', user.id)
          .single();

        // Redirect to onboarding if not completed, otherwise to homepage or next URL
        let redirectUrl;
        if (!profileData?.onboarding_complete) {
          redirectUrl = new URL(`${redirectOrigin}/onboarding?oauth=google`);
        } else if (next) {
          redirectUrl = new URL(next, redirectOrigin);
        } else {
          redirectUrl = new URL(`${redirectOrigin}/homepage`);
        }
        
        return NextResponse.redirect(redirectUrl);
      }
      
      // If code exchange succeeded, get the user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Error getting user after successful code exchange:', userError?.message || 'No user returned');
        const errorRedirect = new URL(`${redirectOrigin}/login`);
        errorRedirect.searchParams.set('error', 'Authentication successful but could not retrieve user');
        return NextResponse.redirect(errorRedirect);
      }
      
      // Check if user profile already exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        // Update existing profile with latest Google info if available
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
          
        if (updateError) {
          console.error('Error updating existing profile:', updateError);
        }
      } else {
        // Create new user profile with guardian role by default
        // Get user metadata to extract Google info
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: fullName,
            avatar_url: user.user_metadata?.avatar_url,
            google_id: user.user_metadata?.sub, // Google's user ID
            role: 'guardian', // Default to guardian role for Google signups
            parent_id: null, // Parents have no parent_id
            onboarding_complete: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          
        if (insertError) {
          console.error('Error creating profile:', insertError);
        }
      }
      
      // Create/update guardian record to link the parent account
      const { error: guardianUpdateError } = await supabase
        .from('guardians')
        .upsert({
          email: user.email,
          weekly_report: true,
          monthly_report: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });

      if (guardianUpdateError) {
        console.warn('Warning: Failed to update guardian record:', guardianUpdateError);
      }
      
      // Check if user has completed onboarding
      const { data: profileData } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .single();

      // Redirect to onboarding if not completed, otherwise to homepage or next URL
      let redirectUrl;
      if (!profileData?.onboarding_complete) {
        redirectUrl = new URL(`${redirectOrigin}/onboarding?oauth=google`);
      } else if (next) {
        redirectUrl = new URL(next, redirectOrigin);
      } else {
        redirectUrl = new URL(`${redirectOrigin}/homepage`);
      }
      
      return NextResponse.redirect(redirectUrl);
    } catch (err) {
      console.error('Google OAuth callback error:', err);
      const errorRedirect = new URL(`${redirectOrigin}/login`);
      errorRedirect.searchParams.set('error', 'An error occurred during authentication');
      return NextResponse.redirect(errorRedirect);
    }
  } else {
    // If no code is present, try to handle the case where tokens are in the fragment
    console.warn('No authorization code found in query params, checking if session is already established');
    
    // Use redirectOrigin for consistency
    const redirectOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lanamind.com';
    
    try {
      const supabase = await createServerClient();
      
      // Try to get user directly - session might already be established
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.warn('No active session found, redirecting to login');
        const redirectUrl = new URL(`${redirectOrigin}/login`);
        redirectUrl.searchParams.set('error', 'No authorization code received and no active session');
        return NextResponse.redirect(redirectUrl);
      }
      
      console.log('Active session found, proceeding with user setup');
      
      // User is already authenticated, proceed with profile setup
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        // Update existing profile with latest Google info if available
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
          
        if (updateError) {
          console.error('Error updating existing profile:', updateError);
        }
      } else {
        // Create new user profile with guardian role by default
        // Get user metadata to extract Google info
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: fullName,
            avatar_url: user.user_metadata?.avatar_url,
            google_id: user.user_metadata?.sub, // Google's user ID
            role: 'guardian', // Default to guardian role for Google signups
            parent_id: null, // Parents have no parent_id
            onboarding_complete: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          
        if (insertError) {
          console.error('Error creating profile:', insertError);
        }
      }
      
      // Create/update guardian record to link the parent account
      const { error: guardianUpdateError } = await supabase
        .from('guardians')
        .upsert({
          email: user.email,
          weekly_report: true,
          monthly_report: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });

      if (guardianUpdateError) {
        console.warn('Warning: Failed to update guardian record:', guardianUpdateError);
      }
      
      // Check if user has completed onboarding
      const { data: profileData } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .single();

      // Redirect to onboarding if not completed, otherwise to homepage or next URL
      let redirectUrl;
      if (!profileData?.onboarding_complete) {
        redirectUrl = new URL(`${redirectOrigin}/onboarding?oauth=google`);
      } else {
        redirectUrl = new URL(`${redirectOrigin}/homepage`);
      }
      
      return NextResponse.redirect(redirectUrl);
    } catch (err) {
      console.error('Error handling callback without code:', err);
      const errorRedirect = new URL(`${redirectOrigin}/login`);
      errorRedirect.searchParams.set('error', 'Error processing authentication callback');
      return NextResponse.redirect(errorRedirect);
    }
  }
}