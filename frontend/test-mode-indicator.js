// Test script to verify mode indicator functionality
console.log('Testing mode indicator functionality...\n');

// Test cases for different modes
const testCases = [
  { input: '', expected: 'lesson' },
  { input: '/lesson', expected: 'lesson' },
  { input: '/lesson topic', expected: 'lesson' },
  { input: '/chat', expected: 'chat' },
  { input: '/chat hello', expected: 'chat' },
  { input: '/maths', expected: 'maths' },
  { input: '/maths 2+2', expected: 'maths' },
  { input: '/quick', expected: 'quick' },
  { input: '/quick answer', expected: 'quick' },
  { input: '/unknown', expected: 'lesson' },
];

// Import the getCurrentMode function logic
function getCurrentMode(inputValue) {
  const modeMatch = inputValue.match(/^\/?(\w+)\s*/);
  const SUPPORTED_MODES = ['chat', 'quick', 'lesson', 'maths'];
  if (modeMatch && SUPPORTED_MODES.includes(modeMatch[1].toLowerCase())) {
    return modeMatch[1].toLowerCase();
  }
  return 'lesson'; // Default mode
}

// Run tests
let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = getCurrentMode(testCase.input);
  const status = result === testCase.expected ? 'PASS' : 'FAIL';
  
  if (result === testCase.expected) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(`Test ${index + 1}: ${status}`);
  console.log(`  Input: "${testCase.input}"`);
  console.log(`  Expected: "${testCase.expected}", Got: "${result}"`);
  console.log('');
});

console.log(`Results: ${passed} passed, ${failed} failed`);

// Test the mode display formatting
console.log('\nTesting mode display formatting:');
const modes = ['chat', 'quick', 'lesson', 'maths'];
modes.forEach(mode => {
  const displayText = mode.charAt(0).toUpperCase() + mode.slice(1) + ' Mode';
  console.log(`  ${mode} -> "${displayText}"`);
});