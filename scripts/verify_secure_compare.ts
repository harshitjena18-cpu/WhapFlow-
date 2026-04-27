import { secureCompare } from "../src/supabase/functions/server/crypto.ts";

async function runTests() {
  console.log("🛡️ Starting secureCompare Verification Tests...");

  const testCases = [
    { a: "hello", b: "hello", expected: true, desc: "Identical strings" },
    { a: "hello", b: "world", expected: false, desc: "Different strings same length" },
    { a: "hello", b: "longstring", expected: false, desc: "Different strings different length" },
    { a: "abc", b: "abc\0", expected: false, desc: "Null terminator difference" },
    { a: "", b: "", expected: true, desc: "Empty strings" },
    { a: "secret", b: undefined, expected: false, desc: "Comparison with undefined" },
    { a: null, b: "secret", expected: false, desc: "Comparison with null" },
    { a: "123", b: "123", expected: true, desc: "Numeric strings" }
  ];

  let passCount = 0;
  for (const { a, b, expected, desc } of testCases) {
    const result = secureCompare(a as any, b as any);
    if (result === expected) {
      console.log(`✅ PASS: ${desc}`);
      passCount++;
    } else {
      console.error(`❌ FAIL: ${desc} (Expected ${expected}, got ${result})`);
    }
  }

  console.log(`\nTests completed: ${passCount}/${testCases.length} passed.`);

  if (passCount !== testCases.length) {
    process.exit(1);
  }
}

runTests().catch(err => {
    console.error("❌ Test Runner Error:", err);
    process.exit(1);
});
