import { verifyShopifyWebhook } from "../src/lib/shopify.ts";

async function runTests() {
  console.log("Running verifyShopifyWebhook Tests...");

  const secret = "test_secret_123";
  const body = JSON.stringify({ test: "data" });

  // Helper to generate HMAC
  async function generateHmac(body: string, secret: string) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(body);

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
      msgData
    );

    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  // Test 1: Valid Signature
  console.log("\nTest 1: Valid Signature");
  process.env.SHOPIFY_SECRET = secret;
  const validHmac = await generateHmac(body, secret);
  const result1 = await verifyShopifyWebhook(validHmac, body);
  if (result1 === true) {
    console.log("✅ Passed");
  } else {
    console.error("❌ Failed: Expected true");
    process.exit(1);
  }

  // Test 2: Invalid Signature (Wrong HMAC)
  console.log("\nTest 2: Invalid Signature (Wrong HMAC)");
  const invalidHmac = await generateHmac(body, "other_secret");
  const result2 = await verifyShopifyWebhook(invalidHmac, body);
  if (result2 === false) {
    console.log("✅ Passed");
  } else {
    console.error("❌ Failed: Expected false");
    process.exit(1);
  }

  // Test 3: Wrong Secret (Environment)
  console.log("\nTest 3: Wrong Secret (Environment)");
  process.env.SHOPIFY_SECRET = "wrong_secret";
  const result3 = await verifyShopifyWebhook(validHmac, body);
  if (result3 === false) {
    console.log("✅ Passed");
  } else {
    console.error("❌ Failed: Expected false");
    process.exit(1);
  }

  // Test 4: Missing Secret
  console.log("\nTest 4: Missing Secret");
  delete process.env.SHOPIFY_SECRET;
  const result4 = await verifyShopifyWebhook(validHmac, body);
  if (result4 === false) {
    console.log("✅ Passed");
  } else {
    console.error("❌ Failed: Expected false");
    process.exit(1);
  }

  // Test 5: Malformed HMAC (Base64 error)
  console.log("\nTest 5: Malformed HMAC");
  process.env.SHOPIFY_SECRET = secret;
  // '!' is not a valid base64 character usually, or just garbage string
  const result5 = await verifyShopifyWebhook("NotValidBase64!!", body);
  if (result5 === false) {
    console.log("✅ Passed");
  } else {
    console.error("❌ Failed: Expected false");
    process.exit(1);
  }

  console.log("\n✨ All tests passed!");
}

runTests().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
