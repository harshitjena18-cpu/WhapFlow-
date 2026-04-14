
import { createHmac, subtle } from "node:crypto";
import { Buffer } from "node:buffer";
import assert from "node:assert";

const encoder = new TextEncoder();

// Ported logic from shopify_client.ts / whatsapp.ts to verify it works without .tsx dependencies
async function verifyHmacLogic(rawBody: string, hmacHeader: string, secret: string, isBase64: boolean = true): Promise<boolean> {
  const msgData = encoder.encode(rawBody);
  const keyData = encoder.encode(secret);
  const key = await subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signatureBytes = isBase64 ? Buffer.from(hmacHeader, "base64") : Buffer.from(hmacHeader, "hex");
  return await subtle.verify("HMAC", key, signatureBytes, msgData);
}

// Ported logic from shopify_auth.tsx
async function verifyAuthHmacLogic(hmac: string, secret: string, query: Record<string, string>): Promise<boolean> {
  const { hmac: _, ...rest } = query;
  const keys = Object.keys(rest).sort();
  const message = keys.map(key => `${key}=${rest[key]}`).join("&");
  const msgData = encoder.encode(message);

  const keyData = encoder.encode(secret);
  const key = await subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const hmacBytes = Buffer.from(hmac, "hex");
  return await subtle.verify("HMAC", key, hmacBytes, msgData);
}

async function runTests() {
  console.log("🧪 Verifying HMAC Hardening Logic...");

  // 1. Shopify Webhook (Base64)
  const shopifySecret = "shopify_secret";
  const shopifyBody = JSON.stringify({ cart: 123 });
  const shopifyHmac = createHmac("sha256", shopifySecret).update(shopifyBody).digest("base64");
  const shopifyOk = await verifyHmacLogic(shopifyBody, shopifyHmac, shopifySecret, true);
  assert.strictEqual(shopifyOk, true, "Shopify Webhook HMAC failed");
  console.log("✅ Shopify Webhook logic verified");

  // 2. WhatsApp Webhook (Hex)
  const whatsappSecret = "whatsapp_secret";
  const whatsappBody = JSON.stringify({ msg: "hi" });
  const whatsappHmac = createHmac("sha256", whatsappSecret).update(whatsappBody).digest("hex");
  const whatsappOk = await verifyHmacLogic(whatsappBody, whatsappHmac, whatsappSecret, false);
  assert.strictEqual(whatsappOk, true, "WhatsApp Webhook HMAC failed");
  console.log("✅ WhatsApp Webhook logic verified");

  // 3. Shopify Auth (Hex, Sorted Query)
  const authSecret = "auth_secret";
  const query = { shop: "test.myshopify.com", timestamp: "123456789", state: "xyz" };
  const authMessage = "shop=test.myshopify.com&state=xyz&timestamp=123456789";
  const authHmac = createHmac("sha256", authSecret).update(authMessage).digest("hex");
  const authOk = await verifyAuthHmacLogic(authHmac, authSecret, { ...query, hmac: authHmac });
  assert.strictEqual(authOk, true, "Shopify Auth HMAC failed");
  console.log("✅ Shopify Auth logic verified");

  console.log("🎉 HMAC Hardening Logic verified successfully!");
}

runTests().catch(e => {
  console.error("❌ Tests failed:", e);
  process.exit(1);
});
