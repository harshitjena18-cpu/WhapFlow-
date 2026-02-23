import { getEnv } from '../src/lib/env.ts';

// Helper for assertions
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('Running verify_env.ts...');

const originalDeno = (globalThis as any).Deno;

try {
  // Test 1: Deno environment priority
  console.log('Test 1: Deno environment priority');
  (globalThis as any).Deno = {
    env: {
      get: (key: string) => (key === 'TEST_KEY' ? 'deno_value' : undefined),
    },
  };
  process.env.TEST_KEY = 'process_value';

  const denoValue = getEnv('TEST_KEY');
  assert(denoValue === 'deno_value', `Expected 'deno_value', got '${denoValue}'`);
  console.log('Passed');

  // Test 2: Node.js/Process fallback
  console.log('Test 2: Node.js/Process fallback');
  delete (globalThis as any).Deno;

  const processValue = getEnv('TEST_KEY');
  assert(processValue === 'process_value', `Expected 'process_value', got '${processValue}'`);
  console.log('Passed');

  // Test 3: Missing Key
  console.log('Test 3: Missing Key');
  const missingValue = getEnv('NON_EXISTENT_KEY');
  assert(missingValue === undefined, `Expected undefined, got '${missingValue}'`);
  console.log('Passed');

  console.log('All tests passed!');

} catch (error: any) {
  console.error('Verification failed:', error.message);
  process.exit(1);
} finally {
  // Restore original state
  if (originalDeno) {
    (globalThis as any).Deno = originalDeno;
  } else {
    delete (globalThis as any).Deno;
  }

  // Restore process.env
  delete process.env.TEST_KEY;
}
