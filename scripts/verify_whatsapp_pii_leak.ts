
import { sendWhatsAppTemplate } from "../src/supabase/functions/server/whatsapp.ts";

/**
 * Verification script to check for PII leakage in the WhatsApp sending helper.
 * Meta's API response often echoes the recipient's phone number in the 'to' or 'contacts' field.
 */
async function verifyPIILeak() {
  console.log("🔍 Verifying PII Leak in sendWhatsAppTemplate...");

  // Mock environment variables
  process.env.WHATSAPP_ACCESS_TOKEN = "mock_token";
  process.env.WHATSAPP_PHONE_NUMBER_ID = "mock_phone_id";

  const mockPII = "+1234567890";
  const mockWamid = "wamid.HBgLMTIzNDU2Nzg5MDFGFQIpEhg1NkIzRDdDM0REOTM1QUY1RUEA";

  // Mock Meta API response containing PII
  const mockMetaResponse = {
    messaging_product: "whatsapp",
    contacts: [{ input: mockPII, wa_id: "1234567890" }],
    messages: [{ id: mockWamid }]
  };

  // Mock global fetch
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return {
      ok: true,
      status: 200,
      json: async () => mockMetaResponse
    } as Response;
  };

  try {
    const result = await sendWhatsAppTemplate({
      to: mockPII,
      templateName: "test_template"
    });

    console.log("Result received:", JSON.stringify(result, null, 2));

    // Check if 'data' (the raw Meta response) is present and contains the PII
    // @ts-ignore - 'data' is currently returned but we want to remove it
    if (result.data) {
      // @ts-ignore
      const containsPII = JSON.stringify(result.data).includes(mockPII);
      if (containsPII) {
        console.error("❌ CRITICAL: PII Leak detected! The 'data' object contains the recipient phone number.");
      } else {
        console.log("⚠️ 'data' object returned, but PII not found in this specific mock. Still a risk.");
      }
    } else {
      console.log("✅ SUCCESS: No 'data' object returned. PII leak remediated.");
    }

  } catch (error) {
    console.error("Error during verification:", error);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

verifyPIILeak();
