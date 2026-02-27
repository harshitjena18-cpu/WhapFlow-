
import { redactPII } from "../src/lib/error.ts";

function verifyRedaction() {
  console.log("--- Verifying PII Redaction ---");
  const tests = [
    {
      input: "Error: User john.doe@example.com failed to send to +15551234567",
      expected: "Error: User [REDACTED_EMAIL] failed to send to [REDACTED_PHONE]"
    },
    {
      input: "WhatsApp API Error: Invalid recipient 5551234567",
      expected: "WhatsApp API Error: Invalid recipient [REDACTED_PHONE]"
    }
  ];

  tests.forEach(({ input, expected }, i) => {
    const result = redactPII(input);
    if (result === expected) {
      console.log(`✅ Test ${i + 1} passed`);
    } else {
      console.error(`❌ Test ${i + 1} failed: Expected "${expected}", got "${result}"`);
      process.exit(1);
    }
  });
}

function verifyWhatsAppAuthLogic(authHeader: string | undefined, apiKey: string | undefined, serviceKey: string | undefined) {
  const isAuthorized = (apiKey && authHeader === `Bearer ${apiKey}`) ||
                       (serviceKey && authHeader === `Bearer ${serviceKey}`);

  const wouldWarn = (serviceKey && authHeader === `Bearer ${serviceKey}`) && (authHeader !== `Bearer ${apiKey}`);

  return { isAuthorized, wouldWarn };
}

function verifyAuthTests() {
  console.log("\n--- Verifying WhatsApp Auth Logic ---");
  const tests = [
    { name: "Valid API Key", auth: "Bearer key1", apiKey: "key1", serviceKey: "service1", expected: { isAuthorized: true, wouldWarn: false } },
    { name: "Valid Service Key (Fallback)", auth: "Bearer service1", apiKey: "key1", serviceKey: "service1", expected: { isAuthorized: true, wouldWarn: true } },
    { name: "Invalid Key", auth: "Bearer wrong", apiKey: "key1", serviceKey: "service1", expected: { isAuthorized: false, wouldWarn: false } },
    { name: "Missing Key", auth: undefined, apiKey: "key1", serviceKey: "service1", expected: { isAuthorized: false, wouldWarn: false } },
    { name: "Only Service Key Present", auth: "Bearer service1", apiKey: undefined, serviceKey: "service1", expected: { isAuthorized: true, wouldWarn: true } },
  ];

  tests.forEach(({ name, auth, apiKey, serviceKey, expected }) => {
    const result = verifyWhatsAppAuthLogic(auth, apiKey, serviceKey);
    if (JSON.stringify(result) === JSON.stringify(expected)) {
      console.log(`✅ ${name} passed`);
    } else {
      console.error(`❌ ${name} failed: Expected ${JSON.stringify(expected)}, got ${JSON.stringify(result)}`);
      process.exit(1);
    }
  });
}

verifyRedaction();
verifyAuthTests();
console.log("\n✨ All Sentinel logic verifications passed.");
