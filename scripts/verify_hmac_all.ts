import { Buffer } from "node:buffer";

async function hmacSha256(secret: string, message: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(message);
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, msgData);
  return new Uint8Array(signature);
}

async function runTests() {
  const secret = "hush";

  // Test Case 1: Shopify Auth
  console.log("Testing Shopify Auth HMAC verification logic...");
  const shopifyAuthQuery = {
    shop: "some-shop.myshopify.com",
    timestamp: "1337178173"
  };
  const keys = Object.keys(shopifyAuthQuery).sort();
  const message1 = keys.map(key => `${key}=${shopifyAuthQuery[key]}`).join("&");
  const signature1 = await hmacSha256(secret, message1);
  const hmacHex1 = Buffer.from(signature1).toString("hex");
  console.log("Calculated Shopify Auth HMAC (Hex):", hmacHex1);

  // Test Case 2: Shopify Webhook
  console.log("Testing Shopify Webhook HMAC verification logic...");
  const body2 = '{"foo":"bar"}';
  const signature2 = await hmacSha256(secret, body2);
  const hmacBase64_2 = Buffer.from(signature2).toString("base64");
  console.log("Calculated Shopify Webhook HMAC (Base64):", hmacBase64_2);

  // Test Case 3: WhatsApp Webhook
  console.log("Testing WhatsApp Webhook HMAC verification logic...");
  const body3 = '{"foo":"bar"}';
  const signature3 = await hmacSha256(secret, body3);
  const hmacHex3 = Buffer.from(signature3).toString("hex");
  console.log("Calculated WhatsApp Webhook HMAC (Hex):", hmacHex3);

  console.log("\n✅ Test values generated. Compare with logic in files.");
}

runTests();
