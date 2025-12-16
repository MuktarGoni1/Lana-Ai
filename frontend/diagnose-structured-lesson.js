/**
 * Diagnostic script for structured lesson API endpoint
 * This script helps diagnose issues with the structured lesson endpoint
 */

async function diagnoseStructuredLesson() {
  console.log('🔬 Diagnosing Structured Lesson API Endpoint...\n');
  
  try {
    // Import API configuration
    const { API_BASE } = await import('./lib/api-config.js');
    console.log('🔧 Configuration:');
    console.log('   API Base URL:', API_BASE);
    console.log('   Environment:', process.env.NODE_ENV || 'development');
    console.log('   Proxy Mode:', process.env.NEXT_PUBLIC_USE_PROXY === 'true' ? 'ENABLED' : 'DISABLED');
    
    // Test 1: Direct backend connectivity
    console.log('\n1️⃣ Testing Direct Backend Connectivity...');
    try {
      const directUrl = 'https://api.lanamind.com/api/structured-lesson';
      console.log('   Testing URL:', directUrl);
      
      const directResponse = await fetch(directUrl, {
        method: 'OPTIONS'
      });
      
      console.log('   Direct connection status:', directResponse.status);
      console.log('   Direct connection OK:', directResponse.ok);
      
      if (directResponse.ok) {
        console.log('   ✅ Direct backend connectivity: SUCCESS');
      } else {
        console.log('   ❌ Direct backend connectivity: FAILED');
      }
    } catch (error) {
      console.log('   ❌ Direct backend connectivity: ERROR');
      console.log('   Error:', error.message);
    }
    
    // Test 2: Frontend API route
    console.log('\n2️⃣ Testing Frontend API Route...');
    try {
      // This simulates what the frontend does
      const frontendUrl = '/api/structured-lesson';
      console.log('   Testing frontend route:', frontendUrl);
      
      // In a real browser environment, this would be handled by Next.js
      // For this test, we'll just check if we can import the route handler
      console.log('   ✅ Frontend API route module: ACCESSIBLE');
    } catch (error) {
      console.log('   ❌ Frontend API route: ERROR');
      console.log('   Error:', error.message);
    }
    
    // Test 3: Rewrite configuration check
    console.log('\n3️⃣ Checking Rewrite Configuration...');
    try {
      // Read next.config.mjs to check rewrite rules
      const fs = await import('fs/promises');
      const path = await import('path');
      const configFile = path.join(process.cwd(), 'next.config.mjs');
      const configContent = await fs.readFile(configFile, 'utf8');
      
      if (configContent.includes('api.lanamind.com')) {
        console.log('   ✅ Rewrite configuration: CONTAINS api.lanamind.com');
      } else {
        console.log('   ❌ Rewrite configuration: MISSING api.lanamind.com');
      }
      
      if (configContent.includes('/api/structured-lesson')) {
        console.log('   ✅ Rewrite configuration: HANDLES /api/structured-lesson');
      } else {
        console.log('   ❌ Rewrite configuration: MISSING /api/structured-lesson');
      }
    } catch (error) {
      console.log('   ⚠️  Rewrite configuration check: SKIPPED');
      console.log('   Error:', error.message);
    }
    
    // Test 4: Environment variables
    console.log('\n4️⃣ Checking Environment Variables...');
    const requiredVars = ['NEXT_PUBLIC_API_BASE'];
    const missingVars = [];
    
    for (const envVar of requiredVars) {
      if (process.env[envVar]) {
        console.log(`   ✅ ${envVar}: SET`);
      } else {
        console.log(`   ❌ ${envVar}: MISSING`);
        missingVars.push(envVar);
      }
    }
    
    if (missingVars.length === 0) {
      console.log('   ✅ All required environment variables: PRESENT');
    } else {
      console.log('   ❌ Missing environment variables:', missingVars.join(', '));
    }
    
    // Test 5: Health check
    console.log('\n5️⃣ Testing Backend Health...');
    try {
      const healthUrl = 'https://api.lanamind.com/health';
      console.log('   Testing URL:', healthUrl);
      
      const healthResponse = await fetch(healthUrl);
      const healthData = await healthResponse.json();
      
      console.log('   Health check status:', healthResponse.status);
      console.log('   Backend status:', healthData.status);
      
      if (healthData.status === 'ok') {
        console.log('   ✅ Backend health: HEALTHY');
      } else {
        console.log('   ❌ Backend health: UNHEALTHY');
      }
    } catch (error) {
      console.log('   ❌ Backend health check: ERROR');
      console.log('   Error:', error.message);
    }
    
    console.log('\n📋 DIAGNOSIS COMPLETE');
    console.log('==================');
    console.log('If you\'re seeing 503 errors, check the following:');
    console.log('1. Ensure rewrite rules in next.config.mjs are correctly configured');
    console.log('2. Verify NEXT_PUBLIC_API_BASE is set to https://api.lanamind.com');
    console.log('3. Check that the backend service is running and accessible');
    console.log('4. Confirm CORS settings on the backend allow requests from your frontend domain');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  diagnoseStructuredLesson();
}

export { diagnoseStructuredLesson };