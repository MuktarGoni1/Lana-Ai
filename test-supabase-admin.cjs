/**
 * Test script to directly access Supabase Auth admin API
 * This tests the same functionality used by the verify-email and check-user endpoints
 */

// Import the Supabase admin client
const { getSupabaseAdmin } = require('./lib/supabase-admin');

async function testSupabaseAdmin() {
  console.log('Testing direct Supabase Auth admin API access...');
  
  try {
    // Initialize Supabase admin client
    console.log('Initializing Supabase admin client...');
    const adminClient = getSupabaseAdmin();
    console.log('Supabase admin client initialized successfully');
    
    // List users using the same method as the frontend
    console.log('\n--- Calling listUsers ---');
    const { data, error } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 100
    });
    
    if (error) {
      console.error('Supabase error:', error);
      return;
    }
    
    console.log(`Found ${data.users.length} users`);
    
    // Display some user information (without sensitive data)
    console.log('\nFirst 5 users:');
    data.users.slice(0, 5).forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email || 'No email'}, Confirmed: ${!!user.email_confirmed_at}, Created: ${user.created_at}`);
    });
    
    // Test specific emails
    const testEmails = [
      'climaxvitalityclinic@gmail.com',
      'muktargoni1@gmail.com',
      'bukarabubakar@gmail.com'
    ];
    
    console.log('\n--- Checking specific emails ---');
    testEmails.forEach(email => {
      const user = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (user) {
        console.log(`✓ ${email} - Found (Confirmed: ${!!user.email_confirmed_at})`);
      } else {
        console.log(`✗ ${email} - Not found`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
  
  console.log('\n--- Test completed ---');
}

// Run the test
testSupabaseAdmin().catch(console.error);