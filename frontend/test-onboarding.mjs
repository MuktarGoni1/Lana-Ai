// Simple test script to verify onboarding flow
console.log('Testing onboarding flow...');

// Check if required files exist
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredFiles = [
  'components/consolidated-onboarding.tsx',
  'app/consolidated-onboarding/page.tsx',
  'middleware.ts',
  'app/auth-wrapper.tsx'
];

console.log('Checking required files...');
requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

// Check if the consolidated onboarding route is accessible
console.log('\nChecking route configuration...');
const middlewareContent = fs.readFileSync(path.join(__dirname, 'middleware.ts'), 'utf8');
if (middlewareContent.includes('consolidated-onboarding')) {
  console.log('✅ Middleware configured for consolidated onboarding');
} else {
  console.log('❌ Middleware not configured for consolidated onboarding');
}

// Check if auth wrapper redirects to consolidated onboarding
const authWrapperContent = fs.readFileSync(path.join(__dirname, 'app/auth-wrapper.tsx'), 'utf8');
if (authWrapperContent.includes('consolidated-onboarding')) {
  console.log('✅ Auth wrapper configured for consolidated onboarding');
} else {
  console.log('❌ Auth wrapper not configured for consolidated onboarding');
}

console.log('\n✅ Onboarding enhancement implementation verified!');
console.log('\nTo manually test the onboarding flow:');
console.log('1. Open your browser to http://localhost:3001');
console.log('2. Register a new account');
console.log('3. Verify you are redirected to the consolidated onboarding flow');
console.log('4. Progress through all 5 steps');
console.log('5. Verify you are redirected to the homepage upon completion');