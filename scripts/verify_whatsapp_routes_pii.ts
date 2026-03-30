
import { Hono } from "npm:hono";
import whatsappApp from "../src/supabase/functions/server/whatsapp_routes.tsx";
import mainApp from "../src/supabase/functions/server/index.tsx";

/**
 * Verification script to check for PII leakage in the WhatsApp routes.
 * We use Hono's request method to simulate calls to the actual endpoints.
 */
async function verifyRoutePIILeak() {
  console.log("🔍 Verifying PII Leak in WhatsApp Routes...");

  // Mock environment variables
  process.env.WHATSAPP_API_KEY = "mock_api_key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "mock_service_key";
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
    // 1. Test Modularized Route (whatsapp_routes.tsx)
    console.log("\n--- Testing whatsapp_routes.tsx ---");
    const res1 = await whatsappApp.request("/whatsapp/send", {
      method: "POST",
      headers: { "Authorization": "Bearer mock_api_key" },
      body: JSON.stringify({ phoneNumber: mockPII, templateId: "test" })
    });

    const body1 = await res1.json();
    console.log("Response body:", JSON.stringify(body1, null, 2));

    if (JSON.stringify(body1).includes(mockPII)) {
      console.error("❌ CRITICAL: PII Leak detected in whatsapp_routes.tsx!");
    } else if (body1.data) {
        console.error("❌ CRITICAL: 'data' object still present in whatsapp_routes.tsx!");
    } else {
      console.log("✅ SUCCESS: No PII leak or 'data' object in whatsapp_routes.tsx.");
    }

    // 2. Test Main App Route (index.tsx)
    console.log("\n--- Testing index.tsx redundant route ---");
    // The route in index.tsx is mounted at SERVER_BASE_PATH + /api/whatsapp/send
    // SERVER_BASE_PATH is /make-server-c8eef56a
    const res2 = await mainApp.request("/make-server-c8eef56a/api/whatsapp/send", {
      method: "POST",
      headers: { "Authorization": "Bearer mock_api_key" },
      body: JSON.stringify({ phoneNumber: mockPII, templateId: "test" })
    });

    const body2 = await res2.json();
    console.log("Response body:", JSON.stringify(body2, null, 2));

    if (JSON.stringify(body2).includes(mockPII)) {
      console.error("❌ CRITICAL: PII Leak detected in index.tsx!");
    } else if (body2.data) {
        console.error("❌ CRITICAL: 'data' object still present in index.tsx!");
    } else {
      console.log("✅ SUCCESS: No PII leak or 'data' object in index.tsx.");
    }

  } catch (error) {
    console.error("Error during route verification:", error);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

verifyRoutePIILeak();
