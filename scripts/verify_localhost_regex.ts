import { LOCALHOST_REGEX } from "../src/supabase/functions/server/constants.ts";

const testCases = [
  { origin: "http://localhost:3000", expected: true },
  { origin: "http://localhost", expected: true },
  { origin: "http://127.0.0.1:3000", expected: true },
  { origin: "http://127.0.0.1", expected: true },
  { origin: "http://localhost.attacker.com", expected: false },
  { origin: "https://localhost:3000", expected: false }, // Should be http
  { origin: "http://attacker-localhost:3000", expected: false },
  { origin: "http://127.0.0.1.attacker.com", expected: false },
  { origin: "http://localhost:abc", expected: false },
];

let failed = false;
console.log("🛡️ Verifying LOCALHOST_REGEX...");

for (const { origin, expected } of testCases) {
  const result = LOCALHOST_REGEX.test(origin);
  if (result !== expected) {
    console.error(`❌ Case failed: origin="${origin}", expected=${expected}, got=${result}`);
    failed = true;
  } else {
    console.log(`✅ Case passed: origin="${origin}"`);
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log("🎉 LOCALHOST_REGEX verification passed!");
  process.exit(0);
}
