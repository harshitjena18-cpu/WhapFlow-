import { sendWhatsAppTemplate } from "../src/supabase/functions/server/whatsapp.ts";

const TEST_PHONE = "+15551234567";

async function run() {
  console.log("🧪 Verifying WhatsApp Security Fixes...\n");

  // Mock environment variables
  process.env.WHATSAPP_ACCESS_TOKEN = "fake_token";
  process.env.WHATSAPP_PHONE_NUMBER_ID = "fake_id";

  // Mock fetch
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(init?.body as string);

    // Verification: Meta API should receive phone number WITHOUT '+'
    if (body.to.startsWith('+')) {
       console.error("❌ SECURITY REGRESSION: Phone number sent to Meta API still contains '+'");
    }

    return {
      ok: true,
      json: async () => ({
        messaging_product: "whatsapp",
        contacts: [{ input: TEST_PHONE, wa_id: TEST_PHONE.replace("+", "") }],
        messages: [{ id: "wamid.HBgL" }]
      }),
    } as Response;
  };

  try {
    // 1. Verify Success Case & PII Redaction
    console.log("--- Test 1: Valid Phone & PII Redaction ---");
    const result = await sendWhatsAppTemplate({
      to: TEST_PHONE,
      templateName: "test",
    });

    if (result.success) {
      if ((result as any).data) {
        console.log("❌ PII LEAK DETECTED: Response still contains 'data' object.");
      } else {
        console.log("✅ PII Redacted: 'data' object removed from return.");
      }

      if (result.wamid === "wamid.HBgL") {
        console.log("✅ Correct WAMID returned.");
      }
    } else {
      console.error("❌ Test 1 Failed: Expected success but got error:", result.error);
    }

    // 2. Verify Phone Validation (Invalid)
    console.log("\n--- Test 2: Invalid Phone Validation ---");
    const resultInvalid = await sendWhatsAppTemplate({
      to: "15551234567", // Missing '+'
      templateName: "test",
    });

    if (!resultInvalid.success && resultInvalid.error?.includes("Invalid phone number format")) {
      console.log("✅ Correctly rejected invalid phone number format.");
    } else {
      console.error("❌ Test 2 Failed: Did not reject invalid phone number properly.");
    }

    // 3. Verify Error Sanitization
    console.log("\n--- Test 3: Error Sanitization ---");
    globalThis.fetch = async () => {
       throw new Error(`Failed to send to ${TEST_PHONE}`);
    };

    const resultError = await sendWhatsAppTemplate({
      to: TEST_PHONE,
      templateName: "test",
    });

    if (!resultError.success && resultError.error?.includes("[REDACTED_PHONE]")) {
      console.log("✅ Correctly redacted PII from error message.");
    } else {
      console.error("❌ Test 3 Failed: PII not redacted from error message. Got:", resultError.error);
    }

  } catch (error) {
    console.error("Test runner crashed:", error);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

run();
