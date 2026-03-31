
import { Buffer } from "node:buffer";

// Mocking some crypto functions since we're in a script environment
// and might not have the full Web Crypto API exactly as in the browser/Deno
// but we want to test the logic.

async function testHmac() {
  console.log("Starting HMAC verification test...");

  const secret = "test_secret";
  const message = "test_message";
  const encoder = new TextEncoder();
  const msgData = encoder.encode(message);
  const keyData = encoder.encode(secret);

  // 1. Import Key
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );

  // 2. Sign to get a real HMAC
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, msgData);
  const signatureArray = new Uint8Array(signatureBuffer);

  // 3. Convert to Hex (simulating Shopify OAuth HMAC)
  const hmacHex = Array.from(signatureArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // 4. Convert to Base64 (simulating Shopify Webhook HMAC)
  const hmacBase64 = Buffer.from(signatureArray).toString('base64');

  console.log(`Generated Hex: ${hmacHex}`);
  console.log(`Generated Base64: ${hmacBase64}`);

  // Test Hex conversion (Optimization 1)
  const hexConverted = Buffer.from(hmacHex, "hex");
  const hexMatch = Array.from(hexConverted).every((b, i) => b === signatureArray[i]);
  console.log(`Hex conversion optimization match: ${hexMatch}`);

  // Test Base64 conversion
  const base64Converted = Buffer.from(hmacBase64, "base64");
  const base64Match = Array.from(base64Converted).every((b, i) => b === signatureArray[i]);
  console.log(`Base64 conversion match: ${base64Match}`);

  // Verify using SubtleCrypto
  const isHexValid = await crypto.subtle.verify("HMAC", key, hexConverted, msgData);
  const isBase64Valid = await crypto.subtle.verify("HMAC", key, base64Converted, msgData);

  console.log(`SubtleCrypto Hex verification: ${isHexValid}`);
  console.log(`SubtleCrypto Base64 verification: ${isBase64Valid}`);

  if (hexMatch && base64Match && isHexValid && isBase64Valid) {
    console.log("✅ HMAC Verification Logic Test Passed!");
  } else {
    console.error("❌ HMAC Verification Logic Test Failed!");
    process.exit(1);
  }
}

testHmac().catch(err => {
  console.error(err);
  process.exit(1);
});
