import { createHash, timingSafeEqual } from "node:crypto";

// Mock the secureCompare function from crypto.ts to verify its logic in Node.js
function secureCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;

  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();

  return timingSafeEqual(hashA, hashB) && a.length === b.length;
}

const testCases = [
  { a: "secret", b: "secret", expected: true },
  { a: "secret", b: "wrong", expected: false },
  { a: "secret", b: "secrets", expected: false },
  { a: "secret", b: "", expected: false },
  { a: "", b: "", expected: true },
  { a: null, b: "secret", expected: false },
  { a: "secret", b: undefined, expected: false },
  { a: "a".repeat(1000), b: "a".repeat(1000), expected: true },
  { a: "a".repeat(1000), b: "a".repeat(999) + "b", expected: false },
];

let failed = 0;
for (const { a, b, expected } of testCases) {
  const result = secureCompare(a, b);
  if (result !== expected) {
    console.error(`FAIL: a=${a}, b=${b}, expected=${expected}, got=${result}`);
    failed++;
  } else {
    console.log(`PASS: a=${a}, b=${b}, result=${result}`);
  }
}

if (failed === 0) {
  console.log("All secureCompare tests passed!");
  process.exit(0);
} else {
  console.error(`${failed} tests failed!`);
  process.exit(1);
}
