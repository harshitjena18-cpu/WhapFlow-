import { E164_REGEX } from "../src/supabase/functions/server/constants.ts";
import { redactPII } from "../src/lib/error.ts";

function testE164() {
  console.log("🧪 Testing E164_REGEX...");
  const valid = ["+1234567890", "+447700900123", "+12345"];
  const invalid = ["1234567890", "+012345", "+1234567890123456", "++12345", "abc"];

  valid.forEach(num => {
    if (!E164_REGEX.test(num)) {
      console.error(`❌ Failed: ${num} should be valid`);
      process.exit(1);
    }
  });

  invalid.forEach(num => {
    if (E164_REGEX.test(num)) {
      console.error(`❌ Failed: ${num} should be invalid`);
      process.exit(1);
    }
  });
  console.log("✅ E164_REGEX tests passed.");
}

function testPIIRedaction() {
  console.log("\n🧪 Testing redactPII...");
  const tests = [
    { input: "Call me at +1 234-567-8901", expected: "Call me at [REDACTED_PHONE]" },
    { input: "Email john.doe@example.com for info", expected: "Email [REDACTED_EMAIL] for info" },
    { input: "Multiple: +1234567890 and test@test.com", expected: "Multiple: [REDACTED_PHONE] and [REDACTED_EMAIL]" }
  ];

  tests.forEach(t => {
    const result = redactPII(t.input);
    if (result !== t.expected) {
      console.error(`❌ Failed: Expected "${t.expected}", got "${result}"`);
      process.exit(1);
    }
  });
  console.log("✅ redactPII tests passed.");
}

async function run() {
  testE164();
  testPIIRedaction();
  console.log("\n✨ All Sentinel verification checks passed!");
}

run().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
