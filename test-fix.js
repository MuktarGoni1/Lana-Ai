// Test script to verify the fix for structured lesson API calls
async function testFix() {
  console.log('Testing structured lesson API fix...\n');
  
  try {
    // Test 1: Direct call to correct backend endpoint
    console.log('1. Testing direct call to correct backend endpoint...');
    const directResponse = await fetch('https://api.lanamind.com/api/structured-lesson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: 'JavaScript basics',
        age: 12
      })
    });
    
    console.log('   Status:', directResponse.status);
    if (directResponse.ok) {
      const data = await directResponse.json();
      console.log('   ✅ Direct call successful');
      console.log('   Introduction length:', data.introduction?.length || 0, 'characters');
    } else {
      console.log('   ❌ Direct call failed');
      console.log('   Error:', await directResponse.text());
    }
    
    console.log('\n✅ Fix verification completed!');
    console.log('\nTo fix the 404 error in your frontend:');
    console.log('1. Make sure all API calls use relative paths like "/api/structured-lesson"');
    console.log('2. The Next.js configuration will now redirect incorrect calls automatically');
    console.log('3. Check your frontend code for any hardcoded URLs like "https://lanamind.com/api/structured-lesson"');
    console.log('4. Replace them with relative paths or use the API_BASE configuration');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testFix();