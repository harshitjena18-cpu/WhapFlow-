
import { Buffer } from "node:buffer";

async function verifyHmac(hmac: string, secret: string, message: string) {
  const encoder = new TextEncoder();
  const msgData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  // Optimized conversion
  const hmacBytes = Buffer.from(hmac, "hex");

  return await crypto.subtle.verify("HMAC", key, hmacBytes, msgData);
}

async function runTest() {
  const secret = "test_secret";
  const message = "shop=test.myshopify.com&timestamp=1234567890";

  // Generate a real HMAC for testing
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  const hmacHex = Buffer.from(signature).toString("hex");

  console.log(`Testing with HMAC: ${hmacHex}`);

  const isValid = await verifyHmac(hmacHex, secret, message);
  if (isValid) {
    console.log("✅ HMAC verification successful with optimized conversion");
  } else {
    console.error("❌ HMAC verification failed");
    process.exit(1);
  }

  const isInvalid = await verifyHmac("wrong_hmac", secret, message).catch(() => false);
  if (!isInvalid) {
    console.log("✅ HMAC verification correctly failed for invalid input");
  } else {
    console.error("❌ HMAC verification incorrectly passed for invalid input");
    process.exit(1);
  }
}

runTest().catch(err => {
  console.error(err);
  process.exit(1);
});
