import { secureCompare } from "../src/supabase/functions/server/crypto.ts";

async function runTests() {
  console.log("🛡️ Starting secureCompare Verification Tests...");

  const testCases = [
    { a: "hello", b: "hello", expected: true, desc: "Matching strings" },
    { a: "hello", b: "world", expected: false, desc: "Different strings same length" },
    { a: "hello", b: "hello world", expected: false, desc: "Different strings different length (a < b)" },
    { a: "hello world", b: "hello", expected: false, desc: "Different strings different length (a > b)" },
    { a: "", b: "", expected: true, desc: "Empty strings" },
    { a: "secret123", b: "secret123", expected: true, desc: "Matching secrets" },
    { a: "Bearer sk_123", b: "Bearer sk_123", expected: true, desc: "Matching Bearer tokens" },
    { a: "Bearer sk_123", b: "Bearer sk_456", expected: false, desc: "Different Bearer tokens" },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const result = secureCompare(tc.a, tc.b);
    if (result === tc.expected) {
      console.log(`✅ [PASS] ${tc.desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${tc.desc} - Expected ${tc.expected}, got ${result}`);
    }
  }

  console.log(`\nTests: ${passed}/${testCases.length} passed`);

  if (passed === testCases.length) {
    console.log("✅ All secureCompare tests passed.");
  } else {
    console.error("❌ Some secureCompare tests failed.");
    process.exit(1);
  }
}

runTests().catch(err => {
    console.error("❌ Test Runner Error:", err);
    process.exit(1);
});
