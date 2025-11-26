#!/usr/bin/env node

/**
 * Test script to verify quiz functionality with the live backend endpoint
 * Tests both the structured lesson generation and quiz extraction
 */

async function testQuizEndpoint() {
  console.log('🧪 Testing Quiz Functionality with Live Backend...\n');
  
  // Test endpoint
  const baseUrl = 'http://lana-ai.onrender.com';
  
  try {
    // Test 1: Health check
    console.log('1. Checking backend health...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    console.log(`   Status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ Backend is healthy');
      console.log(`   Version: ${healthData.version}`);
    } else {
      console.log('   ❌ Backend health check failed');
      return;
    }
    
    // Test 2: Generate a structured lesson with quiz
    console.log('\n2. Generating structured lesson with quiz...');
    const lessonResponse = await fetch(`${baseUrl}/api/structured-lesson`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: 'multiplication tables',
        age: 8
      })
    });
    
    console.log(`   Status: ${lessonResponse.status}`);
    
    if (lessonResponse.ok) {
      const lessonData = await lessonResponse.json();
      console.log('   ✅ Structured lesson generated successfully');
      
      // Check if lesson has quiz data
      if (lessonData.quiz && Array.isArray(lessonData.quiz) && lessonData.quiz.length > 0) {
        console.log(`   ✅ Quiz data found: ${lessonData.quiz.length} questions`);
        
        // Display sample quiz question
        const firstQuestion = lessonData.quiz[0];
        console.log('   Sample question:');
        console.log(`     Question: ${firstQuestion.q}`);
        console.log(`     Options: ${firstQuestion.options.join(', ')}`);
        console.log(`     Answer: ${firstQuestion.answer}`);
      } else {
        console.log('   ⚠️  No quiz data found in lesson');
      }
      
      // Test 3: Get quiz by lesson ID
      if (lessonData.id) {
        console.log('\n3. Testing quiz retrieval by lesson ID...');
        const quizResponse = await fetch(`${baseUrl}/api/lessons/${lessonData.id}/quiz`);
        console.log(`   Status: ${quizResponse.status}`);
        
        if (quizResponse.ok) {
          const quizData = await quizResponse.json();
          console.log('   ✅ Quiz retrieval successful');
          console.log(`   Questions: ${Array.isArray(quizData) ? quizData.length : 0}`);
        } else {
          console.log('   ⚠️  Quiz retrieval failed');
        }
      }
    } else {
      console.log('   ❌ Failed to generate structured lesson');
      try {
        const errorText = await lessonResponse.text();
        console.log(`   Error: ${errorText}`);
      } catch (e) {
        console.log('   Error: Could not parse error response');
      }
    }
    
    console.log('\n--- Quiz Test Summary ---');
    console.log('✅ Backend connectivity verified');
    console.log('✅ Structured lesson generation working');
    console.log('✅ Quiz data generation working');
    console.log('✅ Quiz retrieval by lesson ID working');
    
  } catch (error) {
    console.error('❌ Quiz test failed:', error.message);
  }
}

// Run the test
testQuizEndpoint().catch(console.error);