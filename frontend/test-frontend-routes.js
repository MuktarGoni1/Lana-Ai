/**
 * Test script to check frontend routes and connection
 * This tests if we can access the frontend pages
 */

async function testFrontendRoutes() {
  console.log('Testing frontend routes and connection...');
  
  const routesToTest = [
    '/',
    '/login',
    '/register',
    '/auth/confirmed/guardian',
    '/auth/confirmed/child'
  ];
  
  for (const route of routesToTest) {
    console.log(`\n--- Testing route: ${route} ---`);
    
    try {
      const url = `http://localhost:3001${route}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
        },
      });
      
      console.log(`Status: ${response.status}`);
      console.log(`Status Text: ${response.statusText}`);
      
      // Check if it's a redirect
      if (response.redirected) {
        console.log(`Redirected to: ${response.url}`);
      }
      
      // For HTML responses, we can check the content type
      const contentType = response.headers.get('content-type');
      console.log(`Content-Type: ${contentType}`);
      
      // If it's an HTML page, we can try to read the title
      if (contentType && contentType.includes('text/html')) {
        const text = await response.text();
        // Try to extract the title
        const titleMatch = text.match(/<title>([^<]*)<\/title>/i);
        if (titleMatch) {
          console.log(`Page Title: ${titleMatch[1]}`);
        }
      }
      
    } catch (error) {
      console.error(`Error accessing ${route}:`, error.message);
    }
  }
  
  console.log('\n--- Frontend routes test completed ---');
}

// Run the test
testFrontendRoutes().catch(console.error);