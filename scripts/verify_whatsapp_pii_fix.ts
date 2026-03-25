
import { sendWhatsAppTemplate } from "../src/supabase/functions/server/whatsapp.ts";
import { E164_REGEX } from "../src/supabase/functions/server/constants.ts";
import assert from "node:assert";

// Mock environment variables
process.env.WHATSAPP_ACCESS_TOKEN = "fake_token";
process.env.WHATSAPP_PHONE_NUMBER_ID = "fake_id";

async function testPhoneNumberValidation() {
  console.log("Testing phone number validation...");

  const validNumbers = ["+1234567890", "+447700900123", "+15551234567"];
  const invalidNumbers = ["1234567890", "+1", "++1234567890", "+1234567890123456", "abc", "+123-456"];

  for (const num of validNumbers) {
    assert.ok(E164_REGEX.test(num), `Should be valid: ${num}`);
  }

  for (const num of invalidNumbers) {
    assert.ok(!E164_REGEX.test(num), `Should be invalid: ${num}`);
  }
  console.log("✅ Phone number validation passed.");
}

async function testPIIRedaction() {
  console.log("Testing PII redaction in sendWhatsAppTemplate...");

  // Mock fetch to simulate successful WhatsApp API response
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return {
      ok: true,
      json: async () => ({
        messaging_product: "whatsapp",
        contacts: [{ input: "+1234567890", wa_id: "1234567890" }],
        messages: [{ id: "wamid.HBgLMTIzNDU2Nzg5MBUCABIYFjNFREI1RDhENTBBRDY0RjkzRjVFRUEA" }]
      })
    } as any;
  };

  try {
    const result = await sendWhatsAppTemplate({
      to: "+1234567890",
      templateName: "test_template"
    });

    console.log("Result keys:", Object.keys(result));

    assert.strictEqual(result.success, true);
    assert.ok(result.wamid, "Should have wamid");
    assert.ok(!("data" in result), "Result should NOT contain 'data' object (PII leak risk)");

    console.log("✅ PII redaction test passed.");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function runTests() {
  try {
    await testPhoneNumberValidation();
    await testPIIRedaction();
    console.log("\nAll verification tests passed!");
  } catch (error) {
    console.error("\nVerification tests failed:");
    console.error(error);
    process.exit(1);
  }
}

runTests();
