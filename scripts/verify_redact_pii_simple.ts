import { redactPII } from '../src/lib/error';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error('Assertion failed: ' + message);
  }
}

console.log('Running verify_redact_pii_simple.ts...');

try {
  // Test 1: Email redaction
  const text1 = 'Contact me at john@example.com';
  const redacted1 = redactPII(text1);
  assert(redacted1 === 'Contact me at [REDACTED_EMAIL]', 'Should redact email');
  console.log('Test 1 Passed');

  // Test 2: Phone redaction
  const text2 = 'Call me at 123-456-7890';
  const redacted2 = redactPII(text2);
  assert(redacted2 === 'Call me at [REDACTED_PHONE]', 'Should redact phone number');
  console.log('Test 2 Passed');

  // Test 3: Multiple redactions
  const text3 = 'Email: alice@work.com, Phone: (555) 123-4567';
  const redacted3 = redactPII(text3);
  assert(redacted3 === 'Email: [REDACTED_EMAIL], Phone: [REDACTED_PHONE]', 'Should redact both email and phone');
  console.log('Test 3 Passed');

  // Test 4: Fast-path (no PII)
  const text4 = 'This is a normal log message without any PII.';
  const redacted4 = redactPII(text4);
  assert(redacted4 === text4, 'Should not change text without PII');
  console.log('Test 4 Passed');

  // Test 5: Fast-path with digits but no phone
  const text5 = 'Order ID 12345 processed in 500ms.';
  const redacted5 = redactPII(text5);
  assert(redacted5 === text5, 'Should not redact short sequences of digits');
  console.log('Test 5 Passed');

  console.log('All tests passed!');
} catch (e: any) {
  console.error('Verification failed:', e.message);
  process.exit(1);
}
