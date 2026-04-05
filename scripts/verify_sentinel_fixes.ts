import { sendWhatsAppTemplate } from "../src/supabase/functions/server/whatsapp.ts";
import { redactPII, getErrorMessage } from "../src/lib/error.ts";
import { E164_REGEX } from "../src/supabase/functions/server/constants.ts";

// Mock env
process.env.WHATSAPP_ACCESS_TOKEN = "test_token";
process.env.WHATSAPP_PHONE_NUMBER_ID = "test_id";

async function testPhoneValidation() {
  console.log("--- Testing Phone Validation ---");
  const invalidPhones = ["12345", "abcdefghij", "+123", "+01234567890"];
  const validPhones = ["+15551234567", "+447700900123"];

  for (const phone of invalidPhones) {
    const result = await sendWhatsAppTemplate({ to: phone, templateName: "test" });
    if (!result.success && result.error === "Invalid phone number format") {
      console.log(`✅ Correctly rejected invalid phone: ${phone}`);
    } else {
      console.error(`❌ Failed to reject invalid phone: ${phone}`, result);
    }
  }

  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ messages: [{ id: "wamid.123" }] })
  } as any);

  for (const phone of validPhones) {
    const result = await sendWhatsAppTemplate({ to: phone, templateName: "test" });
    if (result.success) {
      console.log(`✅ Correctly accepted valid phone: ${phone}`);
    } else {
      console.error(`❌ Failed to accept valid phone: ${phone}`, result);
    }
  }
  global.fetch = originalFetch;
}

async function testPIIRedactionInResponse() {
  console.log("--- Testing PII Redaction in Response ---");
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      messaging_product: "whatsapp",
      messages: [{ id: "wamid.123" }],
      to: "+15551234567" // Meta echoed PII
    })
  } as any);

  const result = await sendWhatsAppTemplate({ to: "+15551234567", templateName: "test" });
  global.fetch = originalFetch;

  if (result.success) {
    if ((result as any).data) {
      console.error("❌ PII LEAK: Success response contains raw 'data' object");
    } else {
      console.log("✅ Success response does NOT contain raw 'data' object");
    }
    if (result.wamid === "wamid.123") {
      console.log("✅ Correct wamid returned");
    }
  }
}

async function testErrorSanitization() {
  console.log("--- Testing Error Sanitization ---");
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 400,
    json: async () => ({
      error: {
        message: "Message failed for +15551234567",
        code: 100
      }
    })
  } as any);

  const result = await sendWhatsAppTemplate({ to: "+15551234567", templateName: "test" });
  global.fetch = originalFetch;

  if (!result.success) {
    if (result.error?.includes("+15551234567")) {
      console.error("❌ PII LEAK in error message:", result.error);
    } else {
      console.log("✅ Error message redacted PII:", result.error);
    }
  }
}

async function run() {
  try {
    await testPhoneValidation();
    await testPIIRedactionInResponse();
    await testErrorSanitization();
  } catch (e) {
    console.error("Test runner failed:", e);
  }
}

run();
