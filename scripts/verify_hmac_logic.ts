import { Buffer } from "node:buffer";

// Mock constant-time verification logic
async function mockVerifyHmac(rawBody: string, hmac: string, secret: string, format: 'hex' | 'base64'): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(rawBody);
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const hmacBytes = Buffer.from(hmac, format);
  return await crypto.subtle.verify("HMAC", key, hmacBytes, msgData);
}

async function runTests() {
  const secret = "hush";

  // Test Case 1: Shopify Auth (Hex)
  const query = {
    shop: "some-shop.myshopify.com",
    timestamp: "1337178173"
  };
  const keys = Object.keys(query).sort();
  const message1 = keys.map(k => `${k}=${query[k]}`).join("&");
  const hmacHex1 = "c2812f39f84c32c2edaded339a1388abc9829babf351b684ab797f04cd94d4c7";
  const isValid1 = await mockVerifyHmac(message1, hmacHex1, secret, 'hex');
  console.log("Shopify Auth Mock Logic Valid:", isValid1);

  // Test Case 2: Shopify Webhook (Base64)
  const body2 = '{"foo":"bar"}';
  const hmacBase64_2 = "kxsFTgDOlihbs91PqCBFjROWdTQGkFF0NzCvVuvOLsU=";
  const isValid2 = await mockVerifyHmac(body2, hmacBase64_2, secret, 'base64');
  console.log("Shopify Webhook Mock Logic Valid:", isValid2);

  // Test Case 3: WhatsApp Webhook (Hex)
  const body3 = '{"foo":"bar"}';
  const hmacHex3 = "931b054e00ce96285bb3dd4fa820458d13967534069051743730af56ebce2ec5";
  const isValid3 = await mockVerifyHmac(body3, hmacHex3, secret, 'hex');
  console.log("WhatsApp Webhook Mock Logic Valid:", isValid3);

  if (isValid1 && isValid2 && isValid3) {
    console.log("\n✅ All logic checks passed!");
  } else {
    console.error("\n❌ Logic check failed!");
    process.exit(1);
  }
}

runTests();
