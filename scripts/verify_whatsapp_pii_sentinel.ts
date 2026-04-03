
import { sendWhatsAppTemplate } from "../src/supabase/functions/server/whatsapp.ts";

// Mock environment variables
process.env.WHATSAPP_ACCESS_TOKEN = "test_token";
process.env.WHATSAPP_PHONE_NUMBER_ID = "test_phone_id";

// Mock fetch to simulate Meta API response
global.fetch = async (url: string, init: any) => {
  const body = JSON.parse(init.body);
  console.log(`[Mock Fetch] Sending to: ${body.to}`);

  if (body.to.startsWith('+')) {
    console.error("❌ ERROR: Meta API received a '+' prefix which it usually rejects.");
  } else {
    console.log("✅ Meta API received digits without the '+' prefix.");
  }

  // Simulate successful response that echoes back PII (phone number)
  return {
    ok: true,
    status: 200,
    json: async () => ({
      messaging_product: "whatsapp",
      contacts: [{ input: body.to, wa_id: body.to.replace('+', '') }],
      messages: [{ id: "wamid.HBgLMTU1NTEyMzQ1NjcVAgMGAQSA" }]
    })
  } as any;
};

async function testPIILeak() {
  console.log("--- Testing PII Leak in sendWhatsAppTemplate ---");

  const phoneNumber = "+15551234567";
  const result = await sendWhatsAppTemplate({
    to: phoneNumber,
    templateName: "test_template"
  });

  console.log("Result success:", result.success);

  if (result.success) {
    // @ts-ignore: data should be removed
    if (result.data) {
      console.error("❌ SECURITY VULNERABILITY: 'data' object still present in successful response!");
    } else {
      console.log("✅ 'data' object removed from result (Success path)");
    }

    const leakedPII = JSON.stringify(result).includes(phoneNumber);
    if (leakedPII) {
      console.error("❌ SECURITY VULNERABILITY: PII (phone number) leaked in successful response!");
      console.log("Result:", JSON.stringify(result, null, 2));
    } else {
      console.log("✅ No PII leak detected in result (Success path)");
    }
  }

  // Test error path leak
  global.fetch = async () => {
    throw new Error(`Failed to send to ${phoneNumber}`);
  };

  console.log("\n--- Testing PII Leak in Error Path ---");
  const errorResult = await sendWhatsAppTemplate({
    to: phoneNumber,
    templateName: "test_template"
  });

  console.log("Error Result success:", errorResult.success);
  if (!errorResult.success && errorResult.error) {
    const errorMsg = String(errorResult.error);
    const leakedPIIInError = errorMsg.includes(phoneNumber);
    if (leakedPIIInError) {
      console.error("❌ SECURITY VULNERABILITY: PII (phone number) leaked in error message!");
      console.log("Error Message:", errorMsg);
    } else {
      console.log("✅ No PII leak detected in error message");
    }
  }

  console.log("\n--- Testing Invalid Phone Number Format ---");
  const invalidResult = await sendWhatsAppTemplate({
    to: "15551234567", // Missing '+'
    templateName: "test_template"
  });
  console.log("Invalid Result success:", invalidResult.success);
  console.log("Invalid Result error:", invalidResult.error);
}

testPIILeak().catch(console.error);
