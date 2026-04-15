
import { verifyWhatsAppSignature } from "../src/supabase/functions/server/whatsapp.ts";
import { verifyWebhookHmac } from "../src/supabase/functions/server/shopify_client.ts";
import { Buffer } from "node:buffer";

// Mock environment
// @ts-ignore
globalThis.Deno = {
  env: {
    get: (key: string) => {
      if (key === "WHATSAPP_APP_SECRET") return "whatsapp_secret";
      if (key === "SHOPIFY_CLIENT_SECRET") return "shopify_secret";
      return undefined;
    }
  }
};

async function testWhatsApp() {
  console.log("Testing WhatsApp Signature Verification...");
  const payload = JSON.stringify({ object: "whatsapp_business_account", entry: [] });
  const secret = "whatsapp_secret";

  // Calculate expected HMAC
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const signatureHex = Buffer.from(sigBuffer).toString("hex");
  const header = `sha256=${signatureHex}`;

  const isValid = await verifyWhatsAppSignature(payload, header);
  if (isValid) {
    console.log("✅ WhatsApp verification passed");
  } else {
    console.error("❌ WhatsApp verification failed");
    process.exit(1);
  }
}

async function testShopify() {
  console.log("Testing Shopify Webhook HMAC Verification...");
  const payload = JSON.stringify({ id: 12345, note: "Test Cart" });
  const secret = "shopify_secret";

  // Calculate expected HMAC (Shopify uses Base64)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const signatureBase64 = Buffer.from(sigBuffer).toString("base64");

  const isValid = await verifyWebhookHmac(payload, signatureBase64, secret);
  if (isValid) {
    console.log("✅ Shopify verification passed");
  } else {
    console.error("❌ Shopify verification failed");
    process.exit(1);
  }
}

async function run() {
  await testWhatsApp();
  await testShopify();
  console.log("\n✨ All HMAC verification tests passed!");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
