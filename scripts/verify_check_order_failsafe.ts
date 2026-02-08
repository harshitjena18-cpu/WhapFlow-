import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceFile = path.resolve(__dirname, '../src/supabase/functions/server/shopify_client.ts');
const tempFile = path.resolve(__dirname, '_temp_shopify_client.ts');

async function setupTestFile() {
  console.log('📦 Setting up test environment...');
  let content = fs.readFileSync(sourceFile, 'utf-8');

  // Replace imports with mocks to avoid JSR/Deno dependency issues in Node
  content = content.replace(
    'import * as kv from "./kv_store.tsx";',
    'const kv = { get: async () => ({}) };'
  );
  content = content.replace(
    'import { decrypt } from "./crypto.ts";',
    'const decrypt = async (x: string) => x;'
  );

  fs.writeFileSync(tempFile, content);
  console.log('✅ Temporary test file created at', tempFile);
}

async function cleanup() {
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
    console.log('🧹 Cleaned up temporary test file.');
  }
}

async function runTests() {
  try {
    await setupTestFile();

    // Dynamically import the modified module
    // @ts-ignore
    const { checkOrderExists } = await import('./_temp_shopify_client.ts');

    console.log('\n🚀 Running Fail-Safe Tests for checkOrderExists...\n');

    let passed = 0;
    let failed = 0;

    const runTest = async (name: string, mockFetch: () => Promise<Response>, expected: boolean, email?: string, phone?: string) => {
      // Mock global fetch
      global.fetch = mockFetch as any;

      const result = await checkOrderExists(
        'test-shop.myshopify.com',
        'test-token',
        '2023-01-01T00:00:00Z',
        email,
        phone
      );

      if (result === expected) {
        console.log(`✅ ${name}: Passed (Returned ${result})`);
        passed++;
      } else {
        console.error(`❌ ${name}: Failed (Expected ${expected}, got ${result})`);
        failed++;
      }
    };

    const defaultEmail = 'test@example.com';

    // Test 1: Happy Path - No matching orders
    await runTest(
      'Scenario 1: No matching orders found',
      async () => ({
        ok: true,
        json: async () => ({ data: { orders: { nodes: [] } } })
      } as Response),
      false,
      defaultEmail
    );

    // Test 2: Happy Path - Matching order found
    await runTest(
      'Scenario 2: Matching order found',
      async () => ({
        ok: true,
        json: async () => ({ data: { orders: { nodes: [{ id: 'gid://shopify/Order/123' }] } } })
      } as Response),
      true,
      defaultEmail
    );

    // Test 3: Fail-Safe - Network Error
    await runTest(
      'Scenario 3: Fail-Safe on Network Error (fetch throws)',
      async () => { throw new Error('Network timeout'); },
      true, // Should return true (fail-safe)
      defaultEmail
    );

    // Test 4: Fail-Safe - GraphQL Error Response
    await runTest(
      'Scenario 4: Fail-Safe on GraphQL Error',
      async () => ({
        ok: true,
        json: async () => ({ errors: [{ message: 'Rate limited' }] })
      } as Response),
      true, // Should return true (fail-safe)
      defaultEmail
    );

     // Test 5: Fail-Safe - HTTP Error Response
    await runTest(
      'Scenario 5: Fail-Safe on HTTP Error (500)',
      async () => ({
        ok: false,
        status: 500,
        json: async () => ({ errors: 'Internal Server Error' })
      } as Response),
      true, // Should return true (fail-safe)
      defaultEmail
    );

    // Test 6: Fail-Safe - Missing Contact Info
    await runTest(
      'Scenario 6: Fail-Safe on Missing Contact Info (No email/phone)',
      async () => ({
        ok: true,
        json: async () => ({ data: { orders: { nodes: [] } } })
      } as Response),
      true, // Expected: true (fail safe)
      undefined, // Email
      undefined  // Phone
    );

    console.log(`\n📊 Test Summary: ${passed} Passed, ${failed} Failed`);

    if (failed > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('🔥 Critical Test Failure:', error);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

runTests();
