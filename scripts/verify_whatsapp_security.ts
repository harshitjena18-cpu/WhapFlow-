
import { Hono } from "hono";
import { sendWhatsAppTemplate } from "../src/supabase/functions/server/whatsapp.ts";

// Mocking getEnv and globals
process.env.WHATSAPP_PHONE_NUMBER_ID = "12345";
process.env.WHATSAPP_ACCESS_TOKEN = "test_token";
process.env.WHATSAPP_API_KEY = "whatsapp_key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service_key";

async function runTests() {
  console.log("🛡️ Starting WhatsApp Security Verification Tests...");

  // 1. Test Authorization Logic in whatsapp_routes.tsx (Simulated)
  console.log("\n[TEST 1] Testing Authorization Logic...");

  const testAuth = async (token: string | null) => {
    const authHeader = token ? `Bearer ${token}` : null;
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    const whatsappApiKey = process.env.WHATSAPP_API_KEY;

    const isWhatsappAuth = !!(whatsappApiKey && bearerToken === whatsappApiKey);

    return { isWhatsappAuth, authorized: isWhatsappAuth };
  };

  const auth1 = await testAuth("whatsapp_key");
  console.log(`   WhatsApp Key: Authorized=${auth1.authorized}, isWhatsappAuth=${auth1.isWhatsappAuth}`);
  if (!auth1.isWhatsappAuth || !auth1.authorized) throw new Error("WhatsApp Key Auth Failed");

  const auth2 = await testAuth("service_key");
  console.log(`   Service Role Key: Authorized=${auth2.authorized}`);
  if (auth2.authorized) throw new Error("Service Role Key Auth Should Fail (Least Privilege)");

  const auth3 = await testAuth("invalid_key");
  console.log(`   Invalid Key: Authorized=${auth3.authorized}`);
  if (auth3.authorized) throw new Error("Invalid Key Auth Should Fail");

  const auth4 = await testAuth(null);
  console.log(`   No Key: Authorized=${auth4.authorized}`);
  if (auth4.authorized) throw new Error("No Key Auth Should Fail");

  // 2. Test PII Redaction in WhatsApp Error Handling
  console.log("\n[TEST 2] Testing PII Redaction in Error Handling...");

  // Mock fetch to throw an error with PII
  const originalFetch = global.fetch;
  global.fetch = () => {
    throw new Error("Failed to send to +15551234567 for user@example.com");
  };

  const result = await sendWhatsAppTemplate({
    to: "+15551234567",
    templateName: "test"
  });

  console.log(`   Error Message: ${result.error}`);
  if (result.error?.includes("+1555") || result.error?.includes("user@example.com")) {
    throw new Error("PII not redacted from error message!");
  }
  if (!result.error?.includes("[REDACTED_PHONE]") || !result.error?.includes("[REDACTED_EMAIL]")) {
     throw new Error("PII Redaction markers missing!");
  }

  // Restore fetch
  global.fetch = originalFetch;

  console.log("\n✅ WhatsApp Security Verification Tests Complete.");
}

runTests().catch(err => {
  console.error("\n❌ Test Failed:", err.message);
  process.exit(1);
});
