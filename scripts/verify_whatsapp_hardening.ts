import { sendWhatsAppTemplate } from "../src/supabase/functions/server/whatsapp.ts";

// Mock environment
process.env.WHATSAPP_ACCESS_TOKEN = "test_token";
process.env.WHATSAPP_PHONE_NUMBER_ID = "test_phone_id";

async function verify() {
  console.log("🛡️ Verifying WhatsApp Hardening...");

  // Mock fetch to simulate Meta API response with PII
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url: any, init: any) => {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        messaging_product: "whatsapp",
        contacts: [{ input: "+15551234567", wa_id: "15551234567" }],
        messages: [{ id: "wamid.test_id" }]
      })
    } as any;
  };

  try {
    const result = await sendWhatsAppTemplate({
      to: "+15551234567",
      templateName: "test_template"
    });

    console.log("Result object (contacts should be missing):", JSON.stringify(result, null, 2));

    if (result.success) {
      // Check if data is redacted (should NOT contain contacts)
      if (result.data && !(result.data as any).contacts && result.data.messages) {
        console.log("✅ Success: Result data is redacted (contacts removed).");
      } else {
        console.error("❌ Failure: Result data still contains contacts (PII leak) or missing messages.", result.data);
      }
    }

    // Test error case with PII in error message
    globalThis.fetch = async () => {
        throw new Error("Failed to send to +15559998888 because of connection error");
    };

    const errorResult = await sendWhatsAppTemplate({
        to: "+15559998888",
        templateName: "test_template"
    });

    console.log("Error result (should be redacted):", JSON.stringify(errorResult, null, 2));
    if (errorResult.error && errorResult.error.includes("[REDACTED_PHONE]")) {
        console.log("✅ Success: PII in error message is redacted.");
    } else {
        console.error("❌ Failure: PII in error message is NOT redacted.");
    }

  } finally {
    globalThis.fetch = originalFetch;
  }
}

verify();
