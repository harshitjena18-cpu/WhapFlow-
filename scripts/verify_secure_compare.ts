import { secureCompare } from "../src/supabase/functions/server/crypto.ts";

async function runTests() {
  console.log("🛡️ Starting secureCompare verification tests...");

  const testCases = [
    { a: "hello", b: "hello", expected: true, desc: "Identical strings" },
    { a: "hello", b: "world", expected: false, desc: "Different strings, same length" },
    { a: "hello", b: "hello world", expected: false, desc: "Different lengths" },
    { a: "", b: "", expected: true, desc: "Empty strings" },
    { a: "a", b: "b", expected: false, desc: "Single character difference" },
    { a: "verylongstringthatexceedshashblocksizemaybe", b: "verylongstringthatexceedshashblocksizemaybe", expected: true, desc: "Long identical strings" },
    { a: "verylongstringthatexceedshashblocksizemaybe1", b: "verylongstringthatexceedshashblocksizemaybe2", expected: false, desc: "Long different strings" },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const result = secureCompare(tc.a, tc.b);
    if (result === tc.expected) {
      console.log(`✅ PASS: ${tc.desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${tc.desc} (expected ${tc.expected}, got ${result})`);
    }
  }

  console.log(`\nTests finished: ${passed}/${testCases.length} passed.`);

  if (passed !== testCases.length) {
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error("Unhandled error:", e);
  process.exit(1);
});
