import { verifyShopifyWebhook } from "../src/lib/shopify.ts";

const TEST_SECRET = "hush-hush-secret-key-123";
const TEST_BODY = JSON.stringify({
  id: 123456789,
  token: "1234567890abcdef",
  line_items: [],
  currency: "USD",
  customer: {
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com"
  },
  abandoned_checkout_url: "https://example.com/checkout",
  created_at: "2023-01-01T00:00:00Z"
});

// Helper to generate HMAC
async function generateHmac(secret: string, body: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(body)
  );
  // Shopify sends base64 encoded signature
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function runTests() {
  console.log("🧪 Starting verifyShopifyWebhook security tests...");

  // Mock environment variable
  process.env.SHOPIFY_SECRET = TEST_SECRET;

  // 1. Valid Case
  console.log("\n[Test 1] Valid HMAC verification");
  const validHmac = await generateHmac(TEST_SECRET, TEST_BODY);
  const isValid = await verifyShopifyWebhook(validHmac, TEST_BODY);
  if (isValid) {
    console.log("✅ PASS: Valid HMAC accepted");
  } else {
    console.error("❌ FAIL: Valid HMAC rejected");
    process.exit(1);
  }

  // 2. Invalid HMAC
  console.log("\n[Test 2] Invalid HMAC verification");
  const invalidHmac = "SGVsbG8gV29ybGQ="; // Base64 "Hello World"
  const isInvalid = await verifyShopifyWebhook(invalidHmac, TEST_BODY);
  if (!isInvalid) {
    console.log("✅ PASS: Invalid HMAC rejected");
  } else {
    console.error("❌ FAIL: Invalid HMAC accepted");
    process.exit(1);
  }

  // 3. Tampered Body
  console.log("\n[Test 3] Tampered Body verification");
  const tamperedBody = TEST_BODY + " ";
  const isTampered = await verifyShopifyWebhook(validHmac, tamperedBody);
  if (!isTampered) {
    console.log("✅ PASS: Tampered body rejected");
  } else {
    console.error("❌ FAIL: Tampered body accepted");
    process.exit(1);
  }

  // 4. Missing Secret
  console.log("\n[Test 4] Missing Secret");
  const originalSecret = process.env.SHOPIFY_SECRET;
  delete process.env.SHOPIFY_SECRET;

  const isMissing = await verifyShopifyWebhook(validHmac, TEST_BODY);
  if (!isMissing) {
    console.log("✅ PASS: Missing secret returns false");
  } else {
    console.error("❌ FAIL: Missing secret returned true");
    process.exit(1);
  }
  process.env.SHOPIFY_SECRET = originalSecret; // Restore

  // 5. Empty inputs
  console.log("\n[Test 5] Empty inputs");
  const isEmpty = await verifyShopifyWebhook("", "");
  if (!isEmpty) {
    console.log("✅ PASS: Empty inputs rejected");
  } else {
    console.error("❌ FAIL: Empty inputs accepted");
    process.exit(1);
  }

  console.log("\n🎉 All tests passed!");
}

runTests().catch(e => {
  console.error("Unhandled error:", e);
  process.exit(1);
});
