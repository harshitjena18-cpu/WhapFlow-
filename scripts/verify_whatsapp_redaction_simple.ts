
import { sendWhatsAppTemplate } from "../src/supabase/functions/server/whatsapp.ts";

// Mock environment variables
process.env.WHATSAPP_ACCESS_TOKEN = "test_token";
process.env.WHATSAPP_PHONE_NUMBER_ID = "test_id";

async function runTests() {
  console.log("🛡️ Starting WhatsApp Log Redaction Verification...");

  const originalFetch = global.fetch;
  const originalConsoleError = console.error;

  let capturedLogs: string[] = [];
  console.error = (...args: any[]) => {
    capturedLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
  };

  try {
    // Test WhatsApp API Error Redaction in catch block
    console.log("\n[TEST] WhatsApp Catch Block Redaction");

    // Force a network error by making fetch throw
    global.fetch = async () => {
      throw new Error("Network failure with PII: user@example.com +1234567890");
    };

    const result = await sendWhatsAppTemplate({ to: "+1234567890", templateName: "test" });

    const log = capturedLogs.find(l => l.includes("Network/Server Error sending WhatsApp:"));
    console.log(`   Log captured: ${log}`);

    if (log && (log.includes("user@example.com") || log.includes("+1234567890"))) {
      throw new Error("❌ WhatsApp catch block log contains PII!");
    } else if (log && log.includes("[REDACTED_EMAIL]") && log.includes("[REDACTED_PHONE]")) {
      console.log("   ✅ WhatsApp catch block log redacted correctly.");
    } else {
      console.error("Result error:", result.error);
      throw new Error("❌ WhatsApp catch block log missing or incorrect redaction!");
    }

    if (result.error && (result.error.includes("user@example.com") || result.error.includes("+1234567890"))) {
        throw new Error("❌ WhatsApp returned error contains PII!");
    }
    console.log("   ✅ WhatsApp returned error redacted correctly.");

    console.log("\n✅ WhatsApp Log Redaction Test Complete.");
  } finally {
    global.fetch = originalFetch;
    console.error = originalConsoleError;
  }
}

runTests().catch(err => {
    console.error("❌ Test Runner Error:", err);
    process.exit(1);
});
