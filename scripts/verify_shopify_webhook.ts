import { verifyShopifyWebhook } from "../src/lib/shopify.ts";
import { createHmac } from "node:crypto";

const TEST_SECRET = "shh_it_is_a_secret";
const TEST_BODY = JSON.stringify({
  id: 123456,
  test: "payload",
  timestamp: new Date().toISOString()
});

function generateHmac(body: string, secret: string) {
  const hmac = createHmac('sha256', secret);
  hmac.update(body, 'utf8');
  return hmac.digest('base64');
}

async function run() {
  console.log("🧪 Starting Shopify Webhook Verification Tests...\n");

  let passed = 0;
  let failed = 0;

  // Helper for assertions
  const assert = (condition: boolean, name: string) => {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
      failed++;
    }
  };

  try {
    // 1. Happy Path: Valid Signature
    console.log("\n--- Test 1: Valid Signature ---");
    process.env.SHOPIFY_SECRET = TEST_SECRET;
    const validHmac = generateHmac(TEST_BODY, TEST_SECRET);

    // We need to wait for verifyShopifyWebhook
    const result1 = await verifyShopifyWebhook(validHmac, TEST_BODY);
    assert(result1 === true, "Should return true for valid signature");

    // 2. Invalid Signature (Tampered Body)
    console.log("\n--- Test 2: Tampered Body ---");
    // Ensure secret is set
    process.env.SHOPIFY_SECRET = TEST_SECRET;
    const tamperedBody = TEST_BODY + "malicious";
    const result2 = await verifyShopifyWebhook(validHmac, tamperedBody);
    assert(result2 === false, "Should return false for tampered body");

    // 3. Wrong Secret
    console.log("\n--- Test 3: Wrong Secret Configured ---");
    process.env.SHOPIFY_SECRET = "wrong_secret";
    // Using validHmac generated with correct secret, but env has wrong secret
    const result3 = await verifyShopifyWebhook(validHmac, TEST_BODY);
    assert(result3 === false, "Should return false for wrong secret");

    // 4. Missing Secret
    console.log("\n--- Test 4: Missing Secret ---");
    delete process.env.SHOPIFY_SECRET;

    // Suppress console.error for expected failure logs from verifyShopifyWebhook
    const originalConsoleError = console.error;
    console.error = (...args) => {
        // Filter out expected errors
        if (args[0] && typeof args[0] === 'string' && args[0].includes('Missing SHOPIFY_SECRET')) return;
        originalConsoleError(...args);
    };

    const result4 = await verifyShopifyWebhook(validHmac, TEST_BODY);
    console.error = originalConsoleError; // Restore

    assert(result4 === false, "Should return false when secret is missing");

    // 5. Malformed HMAC
    console.log("\n--- Test 5: Malformed HMAC ---");
    process.env.SHOPIFY_SECRET = TEST_SECRET;
    // Passing random string that is not valid base64 might cause error in atob or just fail verification
    const result5 = await verifyShopifyWebhook("not-base64-!@#$", TEST_BODY);
    assert(result5 === false, "Should return false for malformed HMAC");

  } catch (e) {
    console.error("Test runner crashed:", e);
    failed++;
  }

  console.log(`\n\n🎉 Summary: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

run();
