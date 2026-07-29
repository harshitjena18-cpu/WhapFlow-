import app from "../src/supabase/functions/server/whatsapp_routes.tsx";

const TEST_VERIFY_TOKEN = "correct_secret_token_12345";

async function run() {
  console.log("🧪 Starting WhatsApp Webhook Challenge Verification...\n");

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
    // Set the verify token in the environment
    Deno.env.set("WHATSAPP_VERIFY_TOKEN", TEST_VERIFY_TOKEN);

    // 1. Valid verification token and subscribe mode
    console.log("--- Test 1: Valid Verification Challenge ---");
    const res1 = await app.request(
      `/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${TEST_VERIFY_TOKEN}&hub.challenge=test_challenge_123`
    );
    assert(res1.status === 200, "Should return 200 OK");
    const body1 = await res1.text();
    assert(body1 === "test_challenge_123", "Should return the correct challenge text");

    // 2. Invalid verification token
    console.log("\n--- Test 2: Invalid Verification Token ---");
    const res2 = await app.request(
      `/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong_token_here&hub.challenge=test_challenge_123`
    );
    assert(res2.status === 403, "Should return 403 Forbidden");
    const body2 = await res2.json();
    assert(body2.error === "Forbidden", "Should return 'Forbidden' error");

    // 3. Missing verify_token
    console.log("\n--- Test 3: Missing Verification Token ---");
    const res3 = await app.request(
      `/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test_challenge_123`
    );
    assert(res3.status === 403, "Should return 403 Forbidden");

    // 4. Missing subscribe mode
    console.log("\n--- Test 4: Missing Mode ---");
    const res4 = await app.request(
      `/webhooks/whatsapp?hub.verify_token=${TEST_VERIFY_TOKEN}&hub.challenge=test_challenge_123`
    );
    assert(res4.status === 403, "Should return 403 Forbidden");

    // 5. Empty inputs
    console.log("\n--- Test 5: Empty Parameters ---");
    const res5 = await app.request(`/webhooks/whatsapp`);
    assert(res5.status === 403, "Should return 403 Forbidden");

  } catch (e) {
    console.error("Test runner crashed:", e);
    failed++;
  }

  console.log(`\n\n🎉 Summary: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) Deno.exit(1);
}

run();
