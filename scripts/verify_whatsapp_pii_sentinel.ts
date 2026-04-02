
import { sendWhatsAppTemplate } from "../src/supabase/functions/server/whatsapp.ts";

// Mock environment variables
process.env.WHATSAPP_ACCESS_TOKEN = "test-token";
process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789";

// Mock fetch
global.fetch = async (url, init) => {
  return {
    ok: true,
    json: async () => ({
      messaging_product: "whatsapp",
      contacts: [{ input: "15551234567", wa_id: "15551234567" }],
      messages: [{ id: "wamid.HBgLMTU1NTEyMzQ1NjcVAgIAERgSRjAzOUMzNDlCOTdERjRCNThCAA==" }]
    }),
  } as any;
};

async function runTests() {
  console.log("Running security verification for WhatsApp...");

  // 1. Test invalid phone number
  console.log("\nTest 1: Invalid phone number format");
  const result1 = await sendWhatsAppTemplate({
    to: "12345",
    templateName: "test"
  });
  if (!result1.success && result1.error === "Invalid phone number format") {
    console.log("✅ Correctly rejected invalid phone number");
  } else {
    console.error("❌ Failed to reject invalid phone number:", result1);
  }

  // 2. Test valid phone number and PII leakage
  console.log("\nTest 2: Valid phone number and PII leakage check");
  const result2 = await sendWhatsAppTemplate({
    to: "+15551234567",
    templateName: "test"
  });
  if (result2.success) {
    console.log("✅ Successfully sent message with valid phone number");
    if ((result2 as any).data) {
      console.error("❌ PII LEAK: 'data' object still exists in response");
    } else {
      console.log("✅ No PII leak: 'data' object removed from response");
    }
    if (result2.wamid) {
      console.log("✅ Received wamid:", result2.wamid);
    } else {
      console.error("❌ Missing wamid in response");
    }
  } else {
    console.error("❌ Failed to send message with valid phone number:", result2.error);
  }

  // 3. Test error sanitization
  console.log("\nTest 3: Error sanitization check");
  global.fetch = async () => {
    throw new Error("Internal error leaking phone +15551234567 and email test@example.com");
  };

  const result3 = await sendWhatsAppTemplate({
    to: "+15551234567",
    templateName: "test"
  });

  if (!result3.success) {
    console.log("Received error:", result3.error);
    if (result3.error?.includes("+15551234567") || result3.error?.includes("test@example.com")) {
      console.error("❌ PII LEAK in error message!");
    } else if (result3.error?.includes("[REDACTED_PHONE]") || result3.error?.includes("[REDACTED_EMAIL]")) {
      console.log("✅ PII successfully redacted from error message");
    } else {
      console.log("✅ Error message sanitized (PII not found)");
    }
  } else {
    console.error("❌ Test 3 should have failed");
  }
}

runTests().catch(console.error);
