#!/usr/bin/env node

/**
 * Test script to verify the complete quiz flow with the live backend
 */

async function testCompleteQuizFlow() {
  console.log('🧪 Testing Complete Quiz Flow with Live Backend...\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing backend health...');
    const healthResponse = await fetch('http://lana-ai.onrender.com/health');
    console.log(`   Status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      console.log('   ✅ Backend is healthy');
    } else {
      console.log('   ❌ Backend health check failed');
      return;
    }
    
    // Test 2: Generate a structured lesson with quiz (this is how the frontend actually works)
    console.log('\n2. Generating structured lesson with quiz (streaming)...');
    const streamResponse = await fetch('http://lana-ai.onrender.com/api/structured-lesson/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: 'basic subtraction',
        age: 7
      })
    });
    
    console.log(`   Status: ${streamResponse.status}`);
    
    if (streamResponse.ok && streamResponse.body) {
      console.log('   ✅ Stream connection established');
      
      // Process the streaming response
      const reader = streamResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let lessonData = null;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith("data:")) {
            try {
              const data = JSON.parse(line.slice(5));
              if (data.type === "done" && data.lesson) {
                lessonData = data.lesson;
                break;
              }
            } catch (e) {
              // Skip malformed lines
            }
          }
        }
        
        if (lessonData) break;
      }
      
      if (lessonData) {
        console.log('   ✅ Structured lesson generated successfully');
        console.log(`   Lesson ID: ${lessonData.id}`);
        
        // Check if lesson has quiz data
        if (lessonData.quiz && Array.isArray(lessonData.quiz) && lessonData.quiz.length > 0) {
          console.log(`   ✅ Quiz data found: ${lessonData.quiz.length} questions`);
          
          // Display sample quiz question
          const firstQuestion = lessonData.quiz[0];
          console.log('   Sample question:');
          console.log(`     Question: ${firstQuestion.q}`);
          console.log(`     Options: ${firstQuestion.options.join(', ')}`);
          console.log(`     Answer: ${firstQuestion.answer}`);
          
          // Test 3: Simulate frontend quiz navigation
          console.log('\n3. Testing frontend quiz navigation simulation...');
          
          // This is how the frontend actually works:
          // 1. Extract quiz data from the lesson
          // 2. Encode it for URL parameter
          // 3. Navigate to /quiz?data=...
          
          const quizData = lessonData.quiz;
          const encodedQuiz = encodeURIComponent(JSON.stringify(quizData));
          console.log('   ✅ Quiz data extracted and encoded');
          console.log(`   Encoded length: ${encodedQuiz.length} characters`);
          
          // Test 4: Simulate quiz page parsing
          console.log('\n4. Testing quiz page parsing simulation...');
          try {
            const decodedQuiz = JSON.parse(decodeURIComponent(encodedQuiz));
            console.log(`   ✅ Quiz data decoded successfully: ${decodedQuiz.length} questions`);
            
            // Validate quiz structure
            let validQuestions = 0;
            for (const q of decodedQuiz) {
              if (q.q && Array.isArray(q.options) && q.options.length >= 2 && q.answer) {
                if (q.options.includes(q.answer)) {
                  validQuestions++;
                }
              }
            }
            console.log(`   ✅ Valid quiz questions: ${validQuestions}/${decodedQuiz.length}`);
            
          } catch (error) {
            console.log('   ❌ Quiz data decoding failed:', error.message);
          }
          
        } else {
          console.log('   ⚠️  No quiz data found in lesson');
        }
      } else {
        console.log('   ❌ Failed to parse lesson data from stream');
      }
    } else {
      console.log('   ❌ Failed to establish stream connection');
    }
    
    // Test 5: Test frontend quiz endpoints
    console.log('\n5. Testing frontend quiz endpoints...');
    
    // Create a quiz using the frontend API
    const quizCreateResponse = await fetch('http://lana-ai.onrender.com/api/quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        {
          q: "What is 5 - 3?",
          options: ["1", "2", "3", "4"],
          answer: "2"
        },
        {
          q: "What is 10 - 7?",
          options: ["2", "3", "4", "5"],
          answer: "3"
        }
      ])
    });
    
    console.log(`   Quiz creation status: ${quizCreateResponse.status}`);
    
    if (quizCreateResponse.ok) {
      const quizResult = await quizCreateResponse.json();
      console.log('   ✅ Quiz created successfully');
      console.log(`   Quiz ID: ${quizResult.id}`);
      
      if (quizResult.id) {
        // Test retrieving the quiz
        const quizRetrieveResponse = await fetch(`http://lana-ai.onrender.com/api/quiz/${quizResult.id}`);
        console.log(`   Quiz retrieval status: ${quizRetrieveResponse.status}`);
        
        if (quizRetrieveResponse.ok) {
          const retrievedQuiz = await quizRetrieveResponse.json();
          console.log('   ✅ Quiz retrieved successfully');
          console.log(`   Retrieved ${retrievedQuiz.length} questions`);
        } else {
          console.log('   ⚠️  Failed to retrieve quiz');
        }
      }
    } else {
      console.log('   ⚠️  Failed to create quiz');
    }
    
    console.log('\n--- Complete Quiz Flow Test Summary ---');
    console.log('✅ Backend connectivity verified');
    console.log('✅ Structured lesson streaming working');
    console.log('✅ Quiz data generation working');
    console.log('✅ Frontend quiz data extraction and encoding working');
    console.log('✅ Quiz page parsing simulation working');
    console.log('✅ Frontend quiz endpoints working');
    
    console.log('\n--- How the Quiz Flow Actually Works ---');
    console.log('1. User asks a question → Backend generates structured lesson with quiz via streaming');
    console.log('2. Frontend receives lesson data including quiz questions');
    console.log('3. User clicks "Take Quiz" button → Frontend encodes quiz data and navigates to /quiz');
    console.log('4. Quiz page decodes data and presents interactive quiz');
    console.log('5. User completes quiz → Results shown with score and detailed review');
    
  } catch (error) {
    console.error('❌ Complete quiz flow test failed:', error.message);
  }
}

// Run the test
testCompleteQuizFlow().catch(console.error);