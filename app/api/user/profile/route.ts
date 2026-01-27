import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { validateCSRFToken, getCSRFTokenServer } from '@/lib/security/csrf';

// Helper function to get user ID from session
async function getUserId() {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

// GET /api/user/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createServerClient();
    
    // Fetch user profile with RLS protection
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        user_metadata,
        created_at,
        updated_at
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in user profile API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    // Validate CSRF token for state-changing requests
    const csrfToken = request.headers.get('x-csrf-token');
    if (!csrfToken || !validateCSRFToken(csrfToken)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createServerClient();
    const body = await request.json();
    
    // Validate and sanitize input
    const { first_name, last_name, phone, timezone } = body;
    
    if (first_name && (typeof first_name !== 'string' || first_name.length > 50)) {
      return NextResponse.json(
        { error: 'Invalid first name' },
        { status: 400 }
      );
    }
    
    if (last_name && (typeof last_name !== 'string' || last_name.length > 50)) {
      return NextResponse.json(
        { error: 'Invalid last name' },
        { status: 400 }
      );
    }

    // Update user profile with RLS protection
    const { data, error } = await supabase
      .from('users')
      .update({
        user_metadata: {
          ...body,
          updated_at: new Date().toISOString()
        }
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in user profile update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}