import { secureCompare } from "../src/supabase/functions/server/crypto.ts";

async function runTests() {
  console.log("Running secureCompare tests...");

  const testCases = [
    { a: "secret123", b: "secret123", expected: true, desc: "Identical strings" },
    { a: "secret123", b: "secret456", expected: false, desc: "Same length, different content" },
    { a: "secret", b: "secret123", expected: false, desc: "Different length (prefix)" },
    { a: "secret123", b: "secret", expected: false, desc: "Different length (suffix)" },
    { a: "", b: "", expected: true, desc: "Empty strings" },
    { a: "a", b: "", expected: false, desc: "One empty string" },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const result = await secureCompare(tc.a, tc.b);
    if (result === tc.expected) {
      console.log(`✅ PASS: ${tc.desc}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${tc.desc} (expected ${tc.expected}, got ${result})`);
    }
  }

  console.log(`\nTests finished: ${passed}/${testCases.length} passed`);
  if (passed !== testCases.length) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
