import { secureCompare } from "../src/supabase/functions/server/crypto.ts";

async function runTests() {
  console.log("🛡️ Starting secureCompare Verification Tests...");

  const testCases = [
    { a: "secret", b: "secret", expected: true, desc: "Identical strings" },
    { a: "secret", b: "wrong", expected: false, desc: "Different strings" },
    { a: "secret", b: "secre", expected: false, desc: "Different lengths (prefix)" },
    { a: "secret", b: "secretlong", expected: false, desc: "Different lengths (suffix)" },
    { a: "", b: "", expected: true, desc: "Empty strings" },
    { a: "a", b: "b", expected: false, desc: "Single character difference" },
    { a: "12345", b: "12345", expected: true, desc: "Numeric strings" },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const result = secureCompare(tc.a, tc.b);
    if (result === tc.expected) {
      console.log(`✅ PASS: ${tc.desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${tc.desc} (Expected ${tc.expected}, got ${result})`);
    }
  }

  console.log(`\nResults: ${passed}/${testCases.length} tests passed.`);

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
