import { redactPII } from '../src/lib/error';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error('Assertion failed: ' + message);
  }
}

console.log('Running verify_redact_pii_simple.ts...');

try {
  // 1. Standard Phone (10 digits)
  const text1 = 'Call me at 123-456-7890';
  const redacted1 = redactPII(text1);
  assert(redacted1 === 'Call me at [REDACTED_PHONE]', 'Should redact 10-digit phone');
  console.log('Test 1 Passed: 10-digit phone');

  // 2. International Phone (8 digits)
  const text2 = 'My international number is +15550199';
  const redacted2 = redactPII(text2);
  assert(redacted2 === 'My international number is [REDACTED_PHONE]', 'Should redact 8-digit phone');
  console.log('Test 2 Passed: 8-digit international phone');

  // 3. Email Redaction (Legacy check)
  const text3 = 'Email: john.doe@example.com';
  const redacted3 = redactPII(text3);
  assert(redacted3 === 'Email: [REDACTED_EMAIL]', 'Should redact email');
  console.log('Test 3 Passed: Email');

  // 4. Combined
  const text4 = 'Contact john@doe.com or +44 (0) 20 7946 0123';
  const redacted4 = redactPII(text4);
  assert(redacted4.includes('[REDACTED_EMAIL]') && redacted4.includes('[REDACTED_PHONE]'), 'Should redact both');
  console.log('Test 4 Passed: Combined');

  console.log('All redaction verification tests passed!');
} catch (e: any) {
  console.error('Verification failed:', e.message);
  process.exit(1);
}
