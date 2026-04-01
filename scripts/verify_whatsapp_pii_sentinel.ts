
import { sendWhatsAppTemplate } from "../src/supabase/functions/server/whatsapp.ts";

async function testPIILeak() {
  console.log("Testing WhatsApp PII Leak...");

  // Mock fetch
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url: string, init: any) => {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        messaging_product: "whatsapp",
        contacts: [{ input: "1234567890", wa_id: "1234567890" }],
        messages: [{ id: "wamid.test_id" }]
      })
    } as any;
  };

  // Mock Env
  const originalDeno = (globalThis as any).Deno;
  (globalThis as any).Deno = {
    env: {
      get: (key: string) => {
        if (key === "WHATSAPP_ACCESS_TOKEN") return "test_token";
        if (key === "WHATSAPP_PHONE_NUMBER_ID") return "test_id";
        return undefined;
      }
    }
  };

  try {
    const result = await sendWhatsAppTemplate({
      to: "+1234567890",
      templateName: "test_template"
    });

    console.log("Result success:", result.success);
    console.log("Result wamid:", result.wamid);

    if (result.data && result.data.contacts) {
      console.log("❌ PII LEAK FOUND: result.data contains contacts with phone numbers!");
    } else {
      console.log("✅ No PII leak in result.data (or data is missing)");
    }

    if (result.success && !result.wamid) {
      console.log("❌ ERROR: result.wamid is missing on success");
    }

  } catch (error) {
    console.error("Test failed with error:", error);
  } finally {
    globalThis.fetch = originalFetch;
    (globalThis as any).Deno = originalDeno;
  }
}

testPIILeak();
