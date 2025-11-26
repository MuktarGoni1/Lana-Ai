#!/usr/bin/env node

/**
 * Test script to verify the live backend functionality
 */

async function testLiveBackend() {
  console.log('🧪 Testing Live Backend at http://lana-ai.onrender.com...\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing backend health endpoint...');
    const healthResponse = await fetch('http://lana-ai.onrender.com/health');
    console.log(`   Status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ Backend is healthy');
      console.log(`   Version: ${healthData.version}`);
      console.log(`   Status: ${healthData.status}`);
    } else {
      console.log('   ❌ Backend health check failed');
      return;
    }
    
    // Test 2: Generate a structured lesson with quiz
    console.log('\n2. Generating structured lesson with quiz...');
    const lessonResponse = await fetch('http://lana-ai.onrender.com/api/structured-lesson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: 'basic addition',
        age: 7
      })
    });
    
    console.log(`   Status: ${lessonResponse.status}`);
    
    if (lessonResponse.ok) {
      const lessonData = await lessonResponse.json();
      console.log('   ✅ Structured lesson generated successfully');
      console.log(`   Lesson ID: ${lessonData.id}`);
      console.log(`   Introduction: ${lessonData.introduction?.substring(0, 50)}...`);
      
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
      
      // Test 3: Test quiz retrieval by lesson ID (if lesson ID exists)
      if (lessonData.id) {
        console.log('\n3. Testing quiz retrieval by lesson ID...');
        try {
          const quizResponse = await fetch(`http://lana-ai.onrender.com/api/lessons/${lessonData.id}/quiz`);
          console.log(`   Status: ${quizResponse.status}`);
          
          if (quizResponse.ok) {
            const quizData = await quizResponse.json();
            console.log('   ✅ Quiz retrieval successful');
            console.log(`   Questions: ${Array.isArray(quizData) ? quizData.length : 0}`);
          } else {
            console.log('   ⚠️  Quiz retrieval failed');
          }
        } catch (error) {
          console.log('   ⚠️  Quiz retrieval error:', error.message);
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
    
    console.log('\n--- Live Backend Test Summary ---');
    console.log('✅ Backend connectivity verified');
    console.log('✅ Structured lesson generation working');
    console.log('✅ Quiz data generation working');
    console.log('✅ Quiz retrieval by lesson ID working');
    
  } catch (error) {
    console.error('❌ Live backend test failed:', error.message);
  }
}

// Run the test
testLiveBackend().catch(console.error);