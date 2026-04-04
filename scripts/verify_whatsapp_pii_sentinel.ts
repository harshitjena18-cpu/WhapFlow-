
import { sendWhatsAppTemplate } from "../src/supabase/functions/server/whatsapp.ts";

/**
 * MOCK ENVIRONMENT
 */
process.env.WHATSAPP_ACCESS_TOKEN = "fake_token";
process.env.WHATSAPP_PHONE_NUMBER_ID = "fake_id";

// Mock fetch
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  const body = JSON.parse(options.body);

  // Simulate Meta API response
  if (body.to === "15550199") {
    return {
      ok: true,
      json: async () => ({
        messaging_product: "whatsapp",
        contacts: [{ input: "15550199", wa_id: "15550199" }],
        messages: [{ id: "wamid.HBgLMTU1NTAxOTkwOFEVAgARGBI0RDVCOEUzN0RDN0U4AA==" }]
      })
    };
  }

  return {
    ok: false,
    status: 400,
    json: async () => ({
      error: {
        message: "Message to " + body.to + " failed. Invalid recipient email user@example.com",
        type: "OAuthException",
        code: 100
      }
    })
  };
};

async function runTests() {
  console.log("--- 🛡️ SENTINEL: WHATSAPP PII LEAK VERIFICATION ---");

  // 1. Test invalid phone number format
  console.log("\n1. Testing invalid phone format rejection...");
  const invalidResult = await sendWhatsAppTemplate({
    to: "invalid-phone",
    templateName: "test"
  });
  if (!invalidResult.success && invalidResult.error === "Invalid phone number format") {
    console.log("✅ Correctly rejected invalid phone number.");
  } else {
    console.error("❌ Failed to reject invalid phone number:", invalidResult);
  }

  // 2. Test successful send (PII Redaction)
  console.log("\n2. Testing successful send (Sanitization)...");
  const successResult = await sendWhatsAppTemplate({
    to: "+15550199",
    templateName: "test"
  });

  if (successResult.success && successResult.wamid && !(successResult as any).data) {
    console.log("✅ Success result sanitized (no raw data object).");
  } else {
    console.error("❌ Success result still contains PII or missing wamid:", successResult);
  }

  // 3. Test error response sanitization (PII Redaction in error messages)
  console.log("\n3. Testing error response PII redaction...");
  // This will trigger the 'ok: false' branch in our mock fetch
  const errorResult = await sendWhatsAppTemplate({
    to: "+19999999",
    templateName: "test"
  });

  if (!errorResult.success && errorResult.error) {
     if (errorResult.error.includes("[REDACTED_PHONE]") || !errorResult.error.includes("19999999")) {
        console.log("✅ Error message sanitized/redacted.");
     } else {
        console.error("❌ Error message contains raw PII:", errorResult.error);
     }
  }

  console.log("\n--- VERIFICATION COMPLETE ---");
}

runTests().catch(console.error);
