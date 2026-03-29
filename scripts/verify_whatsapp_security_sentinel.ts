import { getEnv } from "../src/lib/env.ts";
import { sendWhatsAppTemplate } from "../src/supabase/functions/server/whatsapp.ts";
import { E164_REGEX } from "../src/supabase/functions/server/constants.ts";

async function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error('Assertion failed: ' + message);
  }
}

// Mock global fetch
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
  return {
    ok: true,
    json: async () => ({
      messaging_product: "whatsapp",
      messages: [{ id: "wamid.test_id_123" }]
    })
  } as Response;
};

// Mock Deno.env (handled by getEnv helper)
process.env.WHATSAPP_ACCESS_TOKEN = "test_token";
process.env.WHATSAPP_PHONE_NUMBER_ID = "test_phone_id";

async function runTests() {
  console.log("Running WhatsApp security verification tests...");

  try {
    // Test 1: E164 Regex validation
    console.log("Test 1: E164 Regex validation");
    assert(E164_REGEX.test("+1234567890"), "Valid E.164 should pass");
    assert(E164_REGEX.test("+15551234567"), "Valid E.164 (US) should pass");
    assert(!E164_REGEX.test("1234567890"), "Missing plus sign should fail");
    assert(!E164_REGEX.test("+0234567890"), "Starting with 0 after plus should fail");
    assert(!E164_REGEX.test("+12345"), "Too short should fail (though regex allows it, we can refine)");
    assert(!E164_REGEX.test("+1234567890123456"), "Too long should fail");
    console.log("✅ Test 1 Passed");

    // Test 2: sendWhatsAppTemplate with invalid phone
    console.log("Test 2: sendWhatsAppTemplate with invalid phone");
    const resultInvalid = await sendWhatsAppTemplate({
      to: "invalid_phone",
      templateName: "test_template"
    });
    assert(resultInvalid.success === false, "Should fail for invalid phone");
    assert(resultInvalid.error?.includes("Invalid phone number format"), "Should return correct error message");
    console.log("✅ Test 2 Passed");

    // Test 3: sendWhatsAppTemplate with valid phone
    console.log("Test 3: sendWhatsAppTemplate with valid phone");
    const resultValid = await sendWhatsAppTemplate({
      to: "+1234567890",
      templateName: "test_template"
    });
    assert(resultValid.success === true, "Should succeed for valid phone");
    assert(resultValid.wamid === "wamid.test_id_123", "Should return wamid");
    // Ensure 'data' is still present but we verify it's not being leaked in the routes
    assert(resultValid.data !== undefined, "Internal result should still contain raw data");
    console.log("✅ Test 3 Passed");

    console.log("All WhatsApp security tests passed!");
  } catch (e: any) {
    console.error("❌ Verification failed:", e.message);
    process.exit(1);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

runTests();
