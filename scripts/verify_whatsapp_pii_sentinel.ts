
import { sendWhatsAppTemplate } from "../src/supabase/functions/server/whatsapp.ts";

async function testPIIFix() {
  console.log("Starting Sentinel Security Verification...");

  // Mock environment variables
  process.env.WHATSAPP_ACCESS_TOKEN = "test_token";
  process.env.WHATSAPP_PHONE_NUMBER_ID = "test_id";

  // Mock global fetch
  global.fetch = async (url: string, options: any) => {
    const body = JSON.parse(options.body);
    console.log(`[Fetch Mock] Request to: ${url}`);
    console.log(`[Fetch Mock] Recipient: ${body.to}`);

    // Simulate Meta API response containing PII (phone number)
    return {
      ok: true,
      status: 200,
      json: async () => ({
        messaging_product: "whatsapp",
        contacts: [{ input: body.to, wa_id: body.to }],
        messages: [{ id: "wamid.HBgLMTIzNDU2Nzg5MBVFAgIAERgSREIyOUU3RDY2QzE2OUNCMDREA" }]
      })
    } as any;
  };

  // 1. Test Valid E.164 (should pass and strip '+')
  console.log("\n--- Test 1: Valid E.164 (+1234567890) ---");
  const result1 = await sendWhatsAppTemplate({ to: "+1234567890", templateName: "test" });
  console.log("Result:", JSON.stringify(result1));
  if (result1.success && result1.wamid && !(result1 as any).data) {
    console.log("✅ PASS: Message sent, wamid returned, raw data omitted.");
  } else {
    console.log("❌ FAIL: Unexpected result format or data leak.");
    process.exit(1);
  }

  // 2. Test Invalid format (missing '+')
  console.log("\n--- Test 2: Invalid format (1234567890) ---");
  const result2 = await sendWhatsAppTemplate({ to: "1234567890", templateName: "test" });
  console.log("Result:", JSON.stringify(result2));
  if (!result2.success && result2.error?.includes("Invalid phone number format")) {
    console.log("✅ PASS: Blocked invalid format.");
  } else {
    console.log("❌ FAIL: Allowed invalid format.");
    process.exit(1);
  }

  // 3. Test Invalid format (too short)
  console.log("\n--- Test 3: Invalid format (+1) ---");
  const result3 = await sendWhatsAppTemplate({ to: "+1", templateName: "test" });
  console.log("Result:", JSON.stringify(result3));
  if (!result3.success && result3.error?.includes("Invalid phone number format")) {
    console.log("✅ PASS: Blocked too short number.");
  } else {
    console.log("❌ FAIL: Allowed too short number.");
    process.exit(1);
  }

  console.log("\n🛡️ Sentinel verification complete: All security checks passed.");
}

testPIIFix().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
