import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { nickname, age, grade, guardianEmail } = await request.json();
    
    if (!nickname || !age || !grade || !guardianEmail) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'All fields (nickname, age, grade, guardianEmail) are required' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate inputs
    if (typeof nickname !== 'string' || nickname.trim().length < 2) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Nickname must be at least 2 characters long' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (typeof age !== 'number' || age < 6 || age > 18) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Age must be between 6 and 18' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const validGrades = ['6', '7', '8', '9', '10', '11', '12', 'college'];
    if (!validGrades.includes(grade)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Grade must be one of: 6, 7, 8, 9, 10, 11, 12, or college' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guardianEmail)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Invalid guardian email format' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cookieStore = await cookies();
    const supabase = await createServerClient();

    // Find the guardian user by email
    const { data: { users }, error: userSearchError } = await supabase.auth.admin.listUsers();
    
    if (userSearchError) {
      console.error('Error searching for guardian:', userSearchError);
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Failed to locate guardian account' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const guardianUser = users.find(user => user.email === guardianEmail);
    
    if (!guardianUser) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Guardian account not found. Please ensure the guardian has registered first.' 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Instead of creating a separate child account, we'll store child data linked to the parent
    // Generate a unique ID for the child
    const childId = `child_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // Check if a child with this nickname already exists for this guardian
    const { data: existingChildData, error: existingChildError } = await supabase
      .from('children')
      .select('*')
      .eq('guardian_id', guardianUser.id)
      .eq('nickname', nickname.trim());
    
    if (existingChildError && existingChildError.message && !existingChildError.message.includes('does not exist')) {
      console.error('Error checking for existing child data:', existingChildError);
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Failed to check for existing child' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (existingChildData && existingChildData.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'A child with this nickname already exists for this guardian' 
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create/update guardian record to link the child
    const { error: guardianUpdateError } = await supabase
      .from('guardians')
      .upsert({
        email: guardianEmail,
        weekly_report: true,
        monthly_report: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

    if (guardianUpdateError) {
      console.warn('Warning: Failed to update guardian record:', guardianUpdateError);
      // Continue anyway, as we'll proceed with child creation
    }

    // Create child record linked to the parent/guardian
    const { data: childRecord, error: childCreationError } = await supabase
      .from('children')
      .insert({
        id: childId,
        nickname: nickname.trim(),
        age: age,
        grade: grade,
        guardian_id: guardianUser.id, // The parent account serves as the central hub
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (childCreationError) {
      console.error('Error creating child record:', childCreationError);
      return new Response(
        JSON.stringify({ 
          success: false,
          message: childCreationError.message || 'Failed to create child record' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create child profile record linked to guardian
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: childId, // Use the same ID as the child record
        email: `${nickname.toLowerCase().replace(/\s+/g, '')}_${guardianUser.id}@child.lana`, // Still create a child email for reference
        full_name: nickname.trim(),
        age: age,
        grade: grade,
        role: 'child',
        parent_id: guardianUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError && profileError.message && !profileError.message.includes('duplicate key value')) {
      console.error('Error creating child profile:', profileError);
      return new Response(
        JSON.stringify({ 
          success: false,
          message: profileError.message || 'Failed to create child profile' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Child account created successfully',
        data: [childRecord]
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Unexpected error in register-child API:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || 'Internal server error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}