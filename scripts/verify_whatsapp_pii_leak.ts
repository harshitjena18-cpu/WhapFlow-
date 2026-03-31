import { sendWhatsAppTemplate } from "../src/supabase/functions/server/whatsapp.ts";

// Mock environment variables
process.env.WHATSAPP_ACCESS_TOKEN = "test_token";
process.env.WHATSAPP_PHONE_NUMBER_ID = "test_id";
process.env.WHATSAPP_API_KEY = "test_api_key";

async function testSanitization() {
  console.log("--- Testing sendWhatsAppTemplate Sanitization ---");

  // Mock fetch
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, options: any) => {
    return {
      ok: true,
      json: async () => ({
        messaging_product: "whatsapp",
        contacts: [{ input: "1234567890", wa_id: "1234567890" }],
        messages: [{ id: "wamid.HBgLMTIzNDU2Nzg5MBUECBIYMjAyMzA1MjIxMzI1MTBa" }]
      }),
    } as Response;
  }) as any;

  try {
    const result = await sendWhatsAppTemplate({
      to: "1234567890",
      templateName: "test_template"
    });

    console.log("Result keys:", Object.keys(result));

    if ("data" in result) {
      console.error("❌ PII LEAK: 'data' object found in result!");
      process.exit(1);
    } else {
      console.log("✅ Success: 'data' object removed from result.");
    }

    if (result.wamid === "wamid.HBgLMTIzNDU2Nzg5MBUECBIYMjAyMzA1MjIxMzI1MTBa") {
      console.log("✅ Success: wamid correctly returned.");
    } else {
      console.error("❌ Error: wamid missing or incorrect.");
      process.exit(1);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function main() {
  await testSanitization();
  console.log("\n✨ SECURITY SANITIZATION PASSED ✨");
}

main().catch(err => {
  console.error("❌ Verification script failed:", err);
  process.exit(1);
});
