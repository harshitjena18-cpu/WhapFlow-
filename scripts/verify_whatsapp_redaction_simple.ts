import { sendWhatsAppMessage, getTemplateStatus } from "../src/lib/whatsapp.ts";

process.env.WHATSAPP_PHONE_NUMBER_ID = "test_id";
process.env.WHATSAPP_ACCESS_TOKEN = "test_token";
process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = "test_biz_id";

async function runTests() {
  console.log("🛡️ Starting WhatsApp Lib Log Redaction Verification Tests...");

  // Mock global fetch
  const originalFetch = global.fetch;
  const originalConsoleError = console.error;

  let capturedLogs: string[] = [];
  console.error = (...args: any[]) => {
    capturedLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
  };

  try {
    // 1. Test sendWhatsAppMessage API Error Redaction
    console.log("\n[TEST 1] sendWhatsAppMessage API Error Redaction");
    const piiData = { error: { message: "Error", phone: "+1234567890" } };

    global.fetch = async () => ({
      ok: false,
      status: 400,
      json: async () => piiData
    } as any);

    await sendWhatsAppMessage({ phoneNumber: "+1234567890", templateId: "test" });

    const whatsappLog = capturedLogs.find(l => l.includes("[WhatsApp] API Error"));
    console.log(`   Log captured: ${whatsappLog}`);

    if (whatsappLog && whatsappLog.includes("+1234567890")) {
      throw new Error("❌ WhatsApp log contains PII!");
    } else if (whatsappLog && whatsappLog.includes("Status 400")) {
      console.log("   ✅ WhatsApp log redacted correctly.");
    } else {
      throw new Error(`❌ WhatsApp log missing or incorrect! Logs: ${JSON.stringify(capturedLogs)}`);
    }

    capturedLogs = [];

    // 2. Test getTemplateStatus API Error Redaction
    console.log("\n[TEST 2] getTemplateStatus API Error Redaction");
    const sensitiveData = { error: { message: "Unauthorized", debug: "secret_token_123" } };

    global.fetch = async () => ({
      ok: false,
      status: 401,
      json: async () => sensitiveData
    } as any);

    await getTemplateStatus("test_template", "test_token");

    const templateLog = capturedLogs.find(l => l.includes("[WhatsApp] Failed to fetch template status"));
    console.log(`   Log captured: ${templateLog}`);

    if (templateLog && (templateLog.includes("secret_token_123") || templateLog.includes("Unauthorized"))) {
      throw new Error("❌ Template status log contains sensitive data!");
    } else if (templateLog && templateLog.includes("Status 401")) {
      console.log("   ✅ Template status log redacted correctly.");
    } else {
      throw new Error(`❌ Template status log missing or incorrect! Logs: ${JSON.stringify(capturedLogs)}`);
    }

    console.log("\n✅ WhatsApp Lib Log Redaction Tests Complete.");
  } finally {
    global.fetch = originalFetch;
    console.error = originalConsoleError;
  }
}

runTests().catch(err => {
    console.error("❌ Test Runner Error:", err);
    process.exit(1);
});
