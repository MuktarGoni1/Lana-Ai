const https = require('https');

// Test the lesson generation endpoint
async function testLessonGeneration() {
  const topic = "photosynthesis";
  const age = 12;
  
  console.log(`Testing lesson generation for topic: "${topic}" with age: ${age}`);
  
  const postData = JSON.stringify({
    topic: topic,
    age: age
  });
  
  const options = {
    hostname: 'lana-ai.onrender.com',
    port: 443,
    path: '/api/structured-lesson',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const lesson = JSON.parse(data);
          console.log('Lesson generation test completed successfully');
          console.log('Response status:', res.statusCode);
          console.log('Response headers:', res.headers);
          
          // Validate response format
          validateLessonStructure(lesson);
          
          resolve(lesson);
        } catch (error) {
          console.error('Error parsing response:', error);
          console.error('Raw response:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

function validateLessonStructure(lesson) {
  console.log('\n=== VALIDATION RESULTS ===');
  
  // 1. Validate the response format contains both lesson content and quiz sections
  const hasIntroduction = lesson.introduction && typeof lesson.introduction === 'string';
  const hasSections = Array.isArray(lesson.sections);
  const hasQuiz = Array.isArray(lesson.quiz);
  
  console.log('1. Response format validation:');
  console.log(`   - Has introduction: ${hasIntroduction}`);
  console.log(`   - Has sections: ${hasSections} (${lesson.sections?.length || 0} sections)`);
  console.log(`   - Has quiz: ${hasQuiz} (${lesson.quiz?.length || 0} questions)`);
  
  // 2. Check lesson structure
  console.log('\n2. Lesson structure validation:');
  if (hasSections) {
    const validSections = lesson.sections.every(section => 
      section.title && typeof section.title === 'string' &&
      section.content && typeof section.content === 'string'
    );
    console.log(`   - Valid section structure: ${validSections}`);
    
    // Show section details
    lesson.sections.forEach((section, index) => {
      console.log(`     Section ${index + 1}: "${section.title}"`);
      const contentLength = section.content?.length || 0;
      console.log(`       Content length: ${contentLength} characters`);
    });
  }
  
  // 3. Verify quiz structure
  console.log('\n3. Quiz validation:');
  if (hasQuiz) {
    const validQuiz = lesson.quiz.every(question => 
      question.q && typeof question.q === 'string' &&
      Array.isArray(question.options) &&
      question.options.length >= 2 &&
      question.answer && typeof question.answer === 'string'
    );
    console.log(`   - Valid quiz structure: ${validQuiz}`);
    console.log(`   - Number of questions: ${lesson.quiz.length}`);
    
    // Show quiz details
    lesson.quiz.forEach((question, index) => {
      console.log(`     Question ${index + 1}: "${question.q}"`);
      console.log(`       Options: ${question.options.length} choices`);
      console.log(`       Correct answer: "${question.answer}"`);
    });
  }
  
  // 4. Performance check (we can't measure actual response time here, but we can check for ID)
  console.log('\n4. Response metadata:');
  console.log(`   - Has lesson ID: ${!!lesson.id}`);
  console.log(`   - Has classifications: ${Array.isArray(lesson.classifications)}`);
  
  // 5. Content safety check (basic)
  console.log('\n5. Content safety check:');
  const contentString = JSON.stringify(lesson);
  const hasScriptTags = /<script/i.test(contentString);
  const hasDangerousTags = /<(iframe|object|embed)/i.test(contentString);
  console.log(`   - Contains <script> tags: ${hasScriptTags}`);
  console.log(`   - Contains dangerous tags: ${hasDangerousTags}`);
  
  // Summary
  console.log('\n=== SUMMARY ===');
  const allValid = hasIntroduction && hasSections && hasQuiz && 
                  (hasSections ? lesson.sections.every(s => s.title && s.content) : true) &&
                  (hasQuiz ? lesson.quiz.every(q => q.q && Array.isArray(q.options) && q.answer) : true);
  
  console.log(`Overall validation: ${allValid ? 'PASSED' : 'FAILED'}`);
  
  if (!allValid) {
    console.log('Issues found:');
    if (!hasIntroduction) console.log('  - Missing or invalid introduction');
    if (!hasSections) console.log('  - Missing or invalid sections');
    if (!hasQuiz) console.log('  - Missing or invalid quiz');
    if (hasScriptTags) console.log('  - Potential XSS risk detected');
  }
}

// Run the test
testLessonGeneration()
  .then(lesson => {
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
  })
  .catch(error => {
    console.error('\n=== TEST FAILED ===');
    console.error(error);
  });