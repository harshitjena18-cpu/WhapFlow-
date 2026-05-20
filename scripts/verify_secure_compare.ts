import { secureCompare } from "../src/supabase/functions/server/crypto.ts";

const tests = [
  { a: "hello", b: "hello", expected: true },
  { a: "hello", b: "world", expected: false },
  { a: "hello", b: "helloo", expected: false },
  { a: "", b: "", expected: true },
  { a: null, b: "test", expected: false },
  { a: "test", b: undefined, expected: false },
];

console.log("Verifying secureCompare...");
let failed = false;
for (const { a, b, expected } of tests) {
  const result = secureCompare(a as any, b as any);
  if (result !== expected) {
    console.error(`FAIL: secureCompare("${a}", "${b}") expected ${expected}, got ${result}`);
    failed = true;
  } else {
    console.log(`PASS: secureCompare("${a}", "${b}") === ${expected}`);
  }
}

if (failed) process.exit(1);
