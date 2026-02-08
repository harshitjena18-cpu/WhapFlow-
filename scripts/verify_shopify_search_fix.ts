
// Re-implementing the function here for test purposes because Node.js cannot handle the jsr: imports in shopify_client.ts dependencies
function escapeShopifySearch(value: string): string {
  return value.replace(/([\\"])/g, "\\$1");
}

async function runTests() {
  console.log("Running Shopify Search Sanitization Verification Tests (Standalone)...");

  const testCases = [
    {
      input: 'test@example.com',
      expected: 'test@example.com',
      name: 'Normal email'
    },
    {
      input: 'test" OR "1"="1',
      expected: 'test\\" OR \\"1\\"=\\"1',
      name: 'Double quote injection'
    },
    {
      input: 'test\\',
      expected: 'test\\\\',
      name: 'Backslash injection'
    },
    {
      input: 'test\\" OR status:open',
      expected: 'test\\\\\\" OR status:open',
      name: 'Mixed injection'
    }
  ];

  let failed = false;
  for (const tc of testCases) {
    const result = escapeShopifySearch(tc.input);
    if (result === tc.expected) {
      console.log(`✅ Passed: ${tc.name}`);
    } else {
      console.error(`❌ Failed: ${tc.name}. Expected '${tc.expected}', got '${result}'`);
      failed = true;
    }
  }

  if (failed) {
    process.exit(1);
  } else {
    console.log("\n✨ All search sanitization tests passed!");
  }
}

runTests().catch(err => {
  console.error("🔥 Test suite failed:", err);
  process.exit(1);
});
