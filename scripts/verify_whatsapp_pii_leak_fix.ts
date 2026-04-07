
import { sendWhatsAppTemplate } from "../src/supabase/functions/server/whatsapp.ts";
import { getEnv } from "../src/lib/env.ts";

// Mock environment variables
process.env.WHATSAPP_ACCESS_TOKEN = "test_token";
process.env.WHATSAPP_PHONE_NUMBER_ID = "test_phone_id";

async function verifyFix() {
  console.log("Starting verification of PII leak fix in WhatsApp sender...");

  // Mock global fetch to intercept WhatsApp API call
  const originalFetch = global.fetch;
  global.fetch = async (url: string, options: any) => {
    return {
      ok: true,
      json: async () => ({
        messaging_product: "whatsapp",
        contacts: [{ input: "1234567890", wa_id: "1234567890" }],
        messages: [{ id: "wamid.test_id" }]
      })
    } as any;
  };

  try {
    const result = await sendWhatsAppTemplate({
      to: "+1234567890",
      templateName: "test_template"
    });

    console.log("Result from sendWhatsAppTemplate:", result);

    if ((result as any).data) {
      console.error("❌ FAILURE: Raw 'data' object still present in result!");
      process.exit(1);
    }

    if (result.success && result.wamid === "wamid.test_id") {
      console.log("✅ SUCCESS: Raw 'data' object removed, 'wamid' preserved.");
    } else {
      console.error("❌ FAILURE: Success status or wamid missing!");
      process.exit(1);
    }

    // Test error sanitization
    global.fetch = async () => {
        throw new Error("Network error with PII: user@example.com +1234567890");
    };

    const errorResult = await sendWhatsAppTemplate({
        to: "+1234567890",
        templateName: "test_template"
    });

    console.log("Error result from sendWhatsAppTemplate:", errorResult);

    if (errorResult.success === false && errorResult.error && typeof errorResult.error === 'string') {
        if (errorResult.error.includes("user@example.com") || errorResult.error.includes("+1234567890")) {
            console.error("❌ FAILURE: PII not redacted from error message!");
            process.exit(1);
        } else if (errorResult.error.includes("[REDACTED_EMAIL]") || errorResult.error.includes("[REDACTED_PHONE]")) {
            console.log("✅ SUCCESS: PII redacted from error message.");
        } else {
            console.error("❌ FAILURE: Error message format unexpected:", errorResult.error);
            process.exit(1);
        }
    } else {
        console.error("❌ FAILURE: Error handling failed!");
        process.exit(1);
    }

  } finally {
    global.fetch = originalFetch;
  }

  console.log("Verification complete.");
}

verifyFix().catch(err => {
    console.error("Verification script failed:", err);
    process.exit(1);
});
