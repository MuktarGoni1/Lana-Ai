// Test script to check if an email is registered and confirmed
async function testEmail(email) {
  try {
    console.log(`Testing email: ${email}`);
    
    const response = await fetch('http://localhost:3001/api/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    console.log('Response:', data);
    
    if (data.exists && data.confirmed) {
      console.log('✅ Email is registered and confirmed');
    } else if (data.exists) {
      console.log('⚠️ Email is registered but not confirmed');
    } else {
      console.log('❌ Email is not registered');
    }
    
    return data;
  } catch (error) {
    console.error('Error testing email:', error);
  }
}

// Test with the provided email
testEmail('muktargoni1@gmail.com');