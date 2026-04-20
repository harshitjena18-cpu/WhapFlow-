import { secureCompare } from "../src/supabase/functions/server/crypto.ts";

function testSecureCompare() {
  console.log("Starting secureCompare verification...");

  const testCases = [
    { a: "hello", b: "hello", expected: true, description: "Identical strings" },
    { a: "hello", b: "world", expected: false, description: "Different strings" },
    { a: "password123", b: "password123", expected: true, description: "Longer identical strings" },
    { a: "password123", b: "password124", expected: false, description: "Different strings, same length" },
    { a: "abc", b: "abcd", expected: false, description: "Different lengths" },
    { a: "", b: "", expected: false, description: "Empty strings" },
    { a: "token", b: undefined as any, expected: false, description: "Comparison with undefined" },
    { a: null as any, b: "token", expected: false, description: "Comparison with null" },
  ];

  let failures = 0;

  testCases.forEach((tc, index) => {
    const result = secureCompare(tc.a, tc.b);
    if (result === tc.expected) {
      console.log(`✅ Test Case ${index + 1}: ${tc.description} - Passed`);
    } else {
      console.error(`❌ Test Case ${index + 1}: ${tc.description} - Failed (Expected ${tc.expected}, got ${result})`);
      failures++;
    }
  });

  if (failures === 0) {
    console.log("\n✨ All secureCompare tests passed!");
    process.exit(0);
  } else {
    console.error(`\n💥 ${failures} test(s) failed.`);
    process.exit(1);
  }
}

testSecureCompare();
