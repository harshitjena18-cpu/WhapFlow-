
import { sendWhatsAppTemplate } from "../src/supabase/functions/server/whatsapp.ts";
import { E164_REGEX } from "../src/supabase/functions/server/constants.ts";

// Mock fetch
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
  console.log("Mock fetch called");
  const body = JSON.parse(init?.body as string);

  return {
    ok: true,
    status: 200,
    json: async () => ({
      messaging_product: "whatsapp",
      contacts: [{ input: body.to, wa_id: body.to.replace("+", "") }],
      messages: [{ id: "wamid.HBgLMTU1NTEyMzQ1NjcVAgARGBI5OEYyM0FCMzI4NkU0RTBBAA==" }]
    }),
  } as Response;
};

// Mock environment
const originalDeno = (globalThis as any).Deno;
(globalThis as any).Deno = {
  env: {
    get: (key: string) => {
      if (key === "WHATSAPP_ACCESS_TOKEN") return "test-token";
      if (key === "WHATSAPP_PHONE_NUMBER_ID") return "123456789";
      return undefined;
    }
  }
};

async function runTests() {
  console.log("🧪 Running WhatsApp PII and Validation Tests...");

  // Test 1: Valid E.164
  console.log("\nTest 1: Valid E.164 number");
  const result1 = await sendWhatsAppTemplate({
    to: "+15551234567",
    templateName: "test_template"
  });
  console.log("Result 1:", JSON.stringify(result1));
  if (result1.success && result1.wamid && !(result1 as any).data) {
    console.log("✅ Test 1 Passed: Success, wamid present, raw data absent.");
  } else {
    console.error("❌ Test 1 Failed");
    process.exit(1);
  }

  // Test 2: Invalid E.164
  console.log("\nTest 2: Invalid E.164 number");
  const result2 = await sendWhatsAppTemplate({
    to: "15551234567", // missing +
    templateName: "test_template"
  });
  console.log("Result 2:", JSON.stringify(result2));
  if (!result2.success && result2.error === "Invalid phone number format") {
    console.log("✅ Test 2 Passed: Correctly rejected invalid format.");
  } else {
    console.error("❌ Test 2 Failed");
    process.exit(1);
  }

  // Test 3: Another Invalid E.164
  console.log("\nTest 3: Too short number");
  const result3 = await sendWhatsAppTemplate({
    to: "+1",
    templateName: "test_template"
  });
  console.log("Result 3:", JSON.stringify(result3));
  if (!result3.success && result3.error === "Invalid phone number format") {
    console.log("✅ Test 3 Passed: Correctly rejected too short number.");
  } else {
    console.error("❌ Test 3 Failed");
    process.exit(1);
  }

  console.log("\n✨ All WhatsApp Security Tests Passed!");
}

runTests().catch(err => {
  console.error("Tests failed with error:", err);
  process.exit(1);
});
