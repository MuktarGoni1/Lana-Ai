/**
 * Test script to access the auth list using the same route as the frontend
 * This script tests the /api/auth/verify-email endpoint which is used by the frontend
 */

async function testAuthList() {
  console.log('Testing auth list access using the same route as frontend...');
  
  // Test emails - using the same emails that were mentioned in the error
  const testEmails = [
    'climaxvitalityclinic@gmail.com',
    'muktargoni1@gmail.com',
    'bukarabubakar@gmail.com'
  ];
  
  for (const email of testEmails) {
    console.log(`\n--- Testing email: ${email} ---`);
    
    try {
      // Using the same endpoint as the frontend (with correct localhost address)
      const response = await fetch('http://localhost:3001/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('Error response:', errorText);
      }
    } catch (error) {
      console.error('Fetch error:', error.message);
      console.error('Make sure the development server is running on port 3001');
    }
  }
  
  console.log('\n--- Test completed ---');
}

// Run the test
testAuthList().catch(console.error);