import { secureCompare } from "../src/supabase/functions/server/crypto.ts";

const testCases = [
  { a: "secret", b: "secret", expected: true },
  { a: "secret", b: "wrong", expected: false },
  { a: "secret", b: "secrets", expected: false },
  { a: "secret", b: "", expected: false },
  { a: "", b: "", expected: true },
  { a: null, b: "secret", expected: false },
  { a: "secret", b: undefined, expected: false },
];

let failed = 0;
for (const { a, b, expected } of testCases) {
  try {
    const result = secureCompare(a, b);
    if (result !== expected) {
      console.error(`FAIL: a=${a}, b=${b}, expected=${expected}, got=${result}`);
      failed++;
    } else {
      console.log(`PASS: a=${a}, b=${b}, result=${result}`);
    }
  } catch (err) {
    console.error(`ERROR testing a=${a}, b=${b}:`, err);
    failed++;
  }
}

if (failed === 0) {
  console.log("All secureCompare tests passed using real implementation!");
  process.exit(0);
} else {
  console.error(`${failed} tests failed!`);
  process.exit(1);
}
