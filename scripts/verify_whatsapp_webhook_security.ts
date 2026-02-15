import { verifyWhatsAppSignature } from "../src/supabase/functions/server/whatsapp.ts";
import { createHmac } from "node:crypto";

const TEST_SECRET = "whatsapp_secret_key";
const TEST_BODY = JSON.stringify({
  entry: [
    {
      changes: [
        {
          value: {
            messaging_product: "whatsapp",
            metadata: { display_phone_number: "15550253483", phone_number_id: "123456" },
            statuses: [{ id: "wamid.HBgL", status: "sent", timestamp: "1689876543", recipient_id: "15551234567" }]
          },
          field: "messages"
        }
      ]
    }
  ]
});

function generateHmac(body: string, secret: string) {
  const hmac = createHmac('sha256', secret);
  hmac.update(body, 'utf8');
  return `sha256=${hmac.digest('hex')}`;
}

async function run() {
  console.log("🧪 Starting WhatsApp Webhook Security Verification...\n");

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, name: string) => {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
      failed++;
    }
  };

  try {
    // 1. Happy Path: Valid Signature
    console.log("\n--- Test 1: Valid Signature ---");
    process.env.WHATSAPP_APP_SECRET = TEST_SECRET;
    const validSignature = generateHmac(TEST_BODY, TEST_SECRET);
    const result1 = await verifyWhatsAppSignature(TEST_BODY, validSignature);
    assert(result1 === true, "Should return true for valid signature");

    // 2. Invalid Signature (Tampered Body)
    console.log("\n--- Test 2: Tampered Body ---");
    process.env.WHATSAPP_APP_SECRET = TEST_SECRET;
    const tamperedBody = TEST_BODY + "malicious";
    const result2 = await verifyWhatsAppSignature(tamperedBody, validSignature);
    assert(result2 === false, "Should return false for tampered body");

    // 3. Wrong Secret Configured
    console.log("\n--- Test 3: Wrong Secret Configured ---");
    process.env.WHATSAPP_APP_SECRET = "wrong_secret";
    const result3 = await verifyWhatsAppSignature(TEST_BODY, validSignature);
    assert(result3 === false, "Should return false for wrong secret");

    // 4. Missing Secret
    console.log("\n--- Test 4: Missing Secret ---");
    delete process.env.WHATSAPP_APP_SECRET;

    // Suppress console.error for expected failure logs
    const originalConsoleError = console.error;
    console.error = (...args) => {
        if (args[0] && typeof args[0] === 'string' && (args[0].includes('Missing WhatsApp App Secret') || args[0].includes('configuration'))) return;
        originalConsoleError(...args);
    };

    const result4 = await verifyWhatsAppSignature(TEST_BODY, validSignature);
    console.error = originalConsoleError;
    assert(result4 === false, "Should return false when secret is missing");

    // 5. Malformed Signature Header
    console.log("\n--- Test 5: Malformed Signature Header ---");
    process.env.WHATSAPP_APP_SECRET = TEST_SECRET;
    const result5 = await verifyWhatsAppSignature(TEST_BODY, "invalid-header-format");
    assert(result5 === false, "Should return false for malformed signature header");

  } catch (e) {
    console.error("Test runner crashed:", e);
    failed++;
  }

  console.log(`\n\n🎉 Summary: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

run();
