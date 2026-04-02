
import { verifyWebhookHmac } from "../src/supabase/functions/server/shopify_client.ts";
import { Buffer } from "node:buffer";

// Mock global crypto for environments where it might be missing or limited
if (!globalThis.crypto) {
    // @ts-ignore
    globalThis.crypto = await import("node:crypto");
}

const TEST_SECRET = "test-secret-key";
const TEST_BODY = JSON.stringify({ test: "data" });

async function generateHmac(body: string, secret: string) {
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
  return Buffer.from(signature).toString("base64");
}

async function runTests() {
  console.log("🧪 Starting verifyWebhookHmac optimization tests...");

  const validHmac = await generateHmac(TEST_BODY, TEST_SECRET);

  // 1. Basic Verification
  console.log("\n[Test 1] Valid HMAC verification");
  const isValid = await verifyWebhookHmac(TEST_BODY, validHmac, TEST_SECRET);
  if (isValid) {
    console.log("✅ PASS: Valid HMAC accepted");
  } else {
    console.error("❌ FAIL: Valid HMAC rejected");
    process.exit(1);
  }

  // 2. Cache/Singleflight Verification (sequential)
  console.log("\n[Test 2] Sequential verification (cache hit)");
  const isValid2 = await verifyWebhookHmac(TEST_BODY, validHmac, TEST_SECRET);
  if (isValid2) {
    console.log("✅ PASS: Cached HMAC accepted");
  } else {
    console.error("❌ FAIL: Cached HMAC rejected");
    process.exit(1);
  }

  // 3. Concurrent Verification (thundering herd check)
  console.log("\n[Test 3] Concurrent verification (Singleflight)");
  const results = await Promise.all([
    verifyWebhookHmac(TEST_BODY, validHmac, TEST_SECRET),
    verifyWebhookHmac(TEST_BODY, validHmac, TEST_SECRET),
    verifyWebhookHmac(TEST_BODY, validHmac, TEST_SECRET)
  ]);
  if (results.every(r => r === true)) {
    console.log("✅ PASS: Concurrent verifications all succeeded");
  } else {
    console.error("❌ FAIL: Concurrent verification failed", results);
    process.exit(1);
  }

  // 4. Secret Change (cache invalidation)
  console.log("\n[Test 4] Secret change invalidation");
  const NEW_SECRET = "new-secret-key";
  const newHmac = await generateHmac(TEST_BODY, NEW_SECRET);
  const isValidNew = await verifyWebhookHmac(TEST_BODY, newHmac, NEW_SECRET);
  if (isValidNew) {
    console.log("✅ PASS: New secret accepted (cache invalidated)");
  } else {
    console.error("❌ FAIL: New secret rejected");
    process.exit(1);
  }

  // 5. Invalid HMAC
  console.log("\n[Test 5] Invalid HMAC rejection");
  const isInvalid = await verifyWebhookHmac(TEST_BODY, "invalid-hmac", TEST_SECRET);
  if (!isInvalid) {
    console.log("✅ PASS: Invalid HMAC rejected");
  } else {
    console.error("❌ FAIL: Invalid HMAC accepted");
    process.exit(1);
  }

  console.log("\n🎉 All HMAC optimization tests passed!");
}

runTests().catch(e => {
  console.error("💥 Test suite crashed:", e);
  process.exit(1);
});
