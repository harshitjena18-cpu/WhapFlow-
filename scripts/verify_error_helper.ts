import { getErrorMessage } from '../src/lib/error';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error('Assertion failed: ' + message);
  }
}

console.log('Running verify_error_helper.ts...');

try {
  // Test 1: Error instance
  const error1 = new Error('Test error');
  const msg1 = getErrorMessage(error1);
  // In Node.js, error.stack includes the error message along with the stack trace.
  // We use .includes() to verify the presence of the original message while allowing for stack trace metadata.
  assert(msg1?.includes('Test error') === true, 'Should extract message from Error instance');
  console.log('Test 1 Passed');

  // Test 2: Object with message
  const error2 = { message: 'Object error' };
  const msg2 = getErrorMessage(error2);
  assert(msg2 === 'Object error', 'Should extract message from object with message property');
  console.log('Test 2 Passed');

  // Test 3: String
  const error3 = 'String error';
  const msg3 = getErrorMessage(error3);
  assert(msg3 === 'String error', 'Should extract message from string');
  console.log('Test 3 Passed');

  // Test 4: Object without message
  const error4 = { foo: 'bar' };
  const msg4 = getErrorMessage(error4);
  assert(msg4 === undefined, 'Should return undefined for object without message');
  console.log('Test 4 Passed');

  // Test 5: Null
  const error5 = null;
  const msg5 = getErrorMessage(error5);
  assert(msg5 === undefined, 'Should return undefined for null');
  console.log('Test 5 Passed');

  // Test 6: Undefined
  const error6 = undefined;
  const msg6 = getErrorMessage(error6);
  assert(msg6 === undefined, 'Should return undefined for undefined');
  console.log('Test 6 Passed');

  // Test 7: Number
  const error7 = 123;
  const msg7 = getErrorMessage(error7);
  assert(msg7 === undefined, 'Should return undefined for number');
  console.log('Test 7 Passed');

  // Test 8: PII Redaction
  const error8 = new Error('User john@doe.com with phone 1234567890 failed');
  const msg8 = getErrorMessage(error8);
  assert(msg8?.includes('[REDACTED_EMAIL]') === true, 'Should redact email');
  assert(msg8?.includes('[REDACTED_PHONE]') === true, 'Should redact phone');
  assert(msg8?.includes('john@doe.com') === false, 'Should not contain raw email');
  console.log('Test 8 Passed');

  console.log('All tests passed!');
} catch (e: any) {
  console.error('Verification failed:', e.message);
  process.exit(1);
}
