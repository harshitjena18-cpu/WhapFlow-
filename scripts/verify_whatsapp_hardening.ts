
import { sendWhatsAppTemplate } from "../src/supabase/functions/server/whatsapp.ts";
import { getEnv } from "../src/lib/env.ts";

async function runTests() {
  console.log("🧪 Starting WhatsApp Hardening Verification...\n");

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, name: string) => {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
      failed++;
    }
  };

  // 1. Mock fetch and environment for success case
  process.env.WHATSAPP_ACCESS_TOKEN = "test_token";
  process.env.WHATSAPP_PHONE_NUMBER_ID = "test_phone_id";

  const originalFetch = globalThis.fetch;

  try {
    // Test Success Response Sanitization
    console.log("--- Test 1: Success Response Sanitization ---");
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        messaging_product: "whatsapp",
        contacts: [{ input: "15551234567", wa_id: "15551234567" }],
        messages: [{ id: "wamid.test_id_123" }]
      }),
      status: 200
    } as any);

    const result = await sendWhatsAppTemplate({ to: "15551234567", templateName: "test" });
    assert(result.success === true, "Should be successful");
    assert(result.wamid === "wamid.test_id_123", "Should return wamid");
    assert((result as any).data === undefined, "Should NOT return raw data (PII protection)");

    // Test Error Response Redaction
    console.log("\n--- Test 2: Error Response Redaction ---");
    globalThis.fetch = async () => {
      throw new Error("Failed to connect to 15551234567");
    };

    const resultError = await sendWhatsAppTemplate({ to: "15551234567", templateName: "test" });
    assert(resultError.success === false, "Should fail");
    assert(typeof resultError.error === 'string', "Error should be a string");
    assert(!resultError.error.includes("15551234567"), "Error message should be redacted (PII protection)");
    assert(resultError.error.includes("[REDACTED_PHONE]"), "Error message should contain redaction placeholder");

  } catch (e) {
    console.error("Test execution failed:", e);
    failed++;
  } finally {
    globalThis.fetch = originalFetch;
  }

  console.log(`\n🎉 Summary: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests();
