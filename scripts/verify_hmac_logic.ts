import { verifyWebhookHmac } from "../src/supabase/functions/server/shopify_client.ts";
import { verifyWhatsAppSignature } from "../src/supabase/functions/server/whatsapp.ts";

// Mock Deno/Supabase environment
(globalThis as any).Deno = {
    env: {
        get: (key: string) => {
            if (key === "WHATSAPP_APP_SECRET") return "test_secret";
            return undefined;
        }
    }
};

async function testShopifyHmac() {
    console.log("Testing Shopify HMAC...");
    const secret = "hush";
    const body = "{}";
    const hmac = "R7W8Pr1qL66mF6H/0U6y2q6K7wQ="; // This is not a real HMAC but we just want to see if it runs without ReferenceError

    try {
        await verifyWebhookHmac(body, hmac, secret);
        console.log("✅ Shopify HMAC check executed without error.");
    } catch (e) {
        console.error("❌ Shopify HMAC check failed:", e);
    }
}

async function testWhatsAppSignature() {
    console.log("Testing WhatsApp Signature...");
    const body = "{}";
    const signature = "sha256=2f57b897931340b073e514f7d23d8c47f7d9834823297a747970868f7634629a";

    try {
        await verifyWhatsAppSignature(body, signature);
        console.log("✅ WhatsApp Signature check executed without error.");
    } catch (e) {
        console.error("❌ WhatsApp Signature check failed:", e);
    }
}

async function runTests() {
    await testShopifyHmac();
    await testWhatsAppSignature();
}

runTests();
