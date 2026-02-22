import { sendWhatsAppTemplate } from "../src/supabase/functions/server/whatsapp.ts";
import { shopifyGraphql } from "../src/supabase/functions/server/shopify_client.ts";

// Mock environment variables
process.env.WHATSAPP_ACCESS_TOKEN = "test_token";
process.env.WHATSAPP_PHONE_NUMBER_ID = "test_id";

async function runTests() {
  console.log("🛡️ Starting Log Redaction Verification Tests...");

  // Mock global fetch
  const originalFetch = global.fetch;
  const originalConsoleError = console.error;

  let capturedLogs: string[] = [];
  console.error = (...args: any[]) => {
    capturedLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
  };

  try {
    // 1. Test WhatsApp API Error Redaction
    console.log("\n[TEST 1] WhatsApp API Error Redaction");
    const piiData = { error: { message: "Error", phone: "+1234567890" } };

    global.fetch = async () => ({
      ok: false,
      status: 400,
      json: async () => piiData
    } as any);

    await sendWhatsAppTemplate({ to: "+1234567890", templateName: "test" });

    const whatsappLog = capturedLogs.find(l => l.includes("WhatsApp API Error"));
    console.log(`   Log captured: ${whatsappLog}`);

    if (whatsappLog && whatsappLog.includes("+1234567890")) {
      throw new Error("❌ WhatsApp log contains PII!");
    } else if (whatsappLog && whatsappLog.includes("Status 400")) {
      console.log("   ✅ WhatsApp log redacted correctly.");
    } else {
      throw new Error("❌ WhatsApp log missing or incorrect!");
    }

    capturedLogs = [];

    // 2. Test Shopify GraphQL Error Redaction
    console.log("\n[TEST 2] Shopify GraphQL Error Redaction");
    const sensitiveShopifyData = { errors: [{ message: "Unauthorized", debug: "secret_token_123" }] };

    global.fetch = async () => ({
      ok: false,
      status: 401,
      json: async () => sensitiveShopifyData
    } as any);

    try {
      await shopifyGraphql("test.myshopify.com", "token", "{ shop { name } }");
    } catch (e) {
      // Expected error
    }

    const shopifyLog = capturedLogs.find(l => l.includes("[ShopifyGraphQL] HTTP Error"));
    console.log(`   Log captured: ${shopifyLog}`);

    if (shopifyLog && (shopifyLog.includes("secret_token_123") || shopifyLog.includes("Unauthorized"))) {
      throw new Error("❌ Shopify log contains sensitive data!");
    } else if (shopifyLog && shopifyLog.includes("HTTP Error: 401")) {
      console.log("   ✅ Shopify log redacted correctly.");
    } else {
      throw new Error("❌ Shopify log missing or incorrect!");
    }

    console.log("\n✅ Log Redaction Tests Complete.");
  } finally {
    global.fetch = originalFetch;
    console.error = originalConsoleError;
  }
}

runTests().catch(err => {
    console.error("❌ Test Runner Error:", err);
    process.exit(1);
});
