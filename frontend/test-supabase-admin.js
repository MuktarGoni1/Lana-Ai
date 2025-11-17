// Simple test script to verify Supabase admin client
const { getSupabaseAdmin } = require('./lib/supabase-admin');

try {
  console.log('Testing Supabase admin client initialization...');
  
  const adminClient = getSupabaseAdmin();
  console.log('Supabase admin client initialized successfully');
  
  // Test listing users
  adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1
  }).then(({ data, error }) => {
    if (error) {
      console.error('Error listing users:', error);
    } else {
      console.log('Successfully listed users, count:', data.users.length);
    }
  }).catch(err => {
    console.error('Error in listUsers:', err);
  });
  
} catch (error) {
  console.error('Error initializing Supabase admin client:', error);
}