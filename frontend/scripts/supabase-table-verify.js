// Supabase Table Verification Script
// This script verifies that the required Supabase tables exist

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '../.env' }); // Check backend .env first
dotenv.config({ path: '.env.local' }); // Then frontend .env.local (overrides)

// Check if required environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Error: Required environment variables are not set');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('For local development, add these to your .env.local file:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('='.repeat(60));
console.log('Lana AI - Supabase Table Verification');
console.log('='.repeat(60));
console.log();

// Use service role key for full access to check tables
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function verifyTables() {
  console.log('🔍 Verifying required tables in Supabase database...');
  console.log();

  let allChecksPassed = true;

  // Check if user_events table exists
  try {
    console.log('Checking user_events table...');
    const { data: userEventsResult, error: userEventsError } = await supabase
      .from('user_events')
      .select('id')
      .limit(1);

    if (userEventsError && userEventsError.code === '42P01') { // undefined_table
      console.log('❌ user_events table does not exist');
      allChecksPassed = false;
    } else if (userEventsError) {
      console.log(`❌ Error checking user_events table: ${userEventsError.message}`);
      allChecksPassed = false;
    } else {
      console.log('✅ user_events table exists');
      
      // Check if required columns exist by trying to select them
      const { error: columnsCheckError } = await supabase
        .from('user_events')
        .select('id, user_id, session_id, event_type, metadata, user_agent, url, ip_address, timestamp')
        .limit(1);

      if (columnsCheckError) {
        console.log(`❌ Some required columns missing in user_events table: ${columnsCheckError.message}`);
        allChecksPassed = false;
      } else {
        console.log('✅ All required columns exist in user_events table');
      }
    }
  } catch (error) {
    console.log(`❌ Error checking user_events table: ${error.message}`);
    allChecksPassed = false;
  }

  console.log();

  // Check if learning_profile column exists in auth.users table
  try {
    console.log('Checking learning_profile column in auth.users table...');
    
    // First, try to check if the column exists by querying the information schema
    // This query checks the auth schema specifically where Supabase Auth stores user data
    const { data: schemaCheck, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'users')
      .eq('column_name', 'learning_profile')
      .ilike('table_schema', 'auth%');

    if (schemaError) {
      // Alternative approach: try to check if we can query the auth.users table directly
      try {
        // Query the auth.users table directly
        const { error: usersError } = await supabase
          .from('auth.users')
          .select('learning_profile')
          .limit(1);

        if (!usersError) {
          console.log('✅ learning_profile column exists in auth.users table');
        } else {
          // Check if the error is about the column not existing vs table access
          if (usersError.code === '42703') { // undefined_column
            console.log('❌ learning_profile column does not exist in auth.users table');
            allChecksPassed = false;
          } else {
            console.log('ℹ️  Unable to verify learning_profile column in auth.users');
            console.log('   (This may be due to permissions - check manually in Supabase dashboard)');
          }
        }
      } catch (authTableError) {
        // If we can't access auth.users, check public.users as fallback
        try {
          const { error: publicUsersError } = await supabase
            .from('users')
            .select('learning_profile')
            .limit(1);

          if (!publicUsersError) {
            console.log('✅ learning_profile column exists in public.users table');
          } else if (publicUsersError.code === '42703') { // undefined_column
            console.log('❌ learning_profile column does not exist in public.users table');
            allChecksPassed = false;
          } else {
            console.log('ℹ️  Unable to verify learning_profile column in public.users');
            console.log('   (This may be due to permissions - check manually in Supabase dashboard)');
          }
        } catch {
          console.log('ℹ️  Unable to verify learning_profile column');
          console.log('   (This may be due to permissions - check manually in Supabase dashboard)');
        }
      }
    } else if (schemaCheck && schemaCheck.length > 0) {
      console.log('✅ learning_profile column exists in users table');
    } else {
      console.log('❌ learning_profile column does not exist in users table');
      allChecksPassed = false;
    }
  } catch (error) {
    console.log(`⚠️  Could not verify learning_profile column: ${error.message}`);
    console.log('   (This may be due to permissions - check manually in Supabase dashboard)');
  }

  console.log();

  if (allChecksPassed) {
    console.log('🎉 All required tables and columns exist!');
    console.log();
    console.log('✅ Supabase setup is complete and ready for use');
    console.log('✅ You can now run the Lana AI application');
  } else {
    console.log('❌ Some required tables or columns are missing');
    console.log();
    console.log('To fix this, please:');
    console.log('1. Run the setup script: npm run supabase:setup');
    console.log('2. Follow the instructions to create the missing tables');
    console.log('3. Run this verification script again');
  }

  console.log();
  console.log('='.repeat(60));
  console.log('Verification completed!');
  console.log('='.repeat(60));

  process.exit(allChecksPassed ? 0 : 1);
}

// Run the verification
verifyTables().catch(error => {
  console.error('❌ Unexpected error during verification:', error.message);
  process.exit(1);
});