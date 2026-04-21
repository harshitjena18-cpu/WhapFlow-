
import { timingSafeEqual, createHash } from "node:crypto";

/**
 * Constant-time comparison of two strings to prevent timing attacks.
 */
export function secureCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;

  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();

  // SHA-256 digests are always 32 bytes, so timingSafeEqual is safe to use.
  return timingSafeEqual(hashA, hashB) && a.length === b.length;
}

function test() {
  console.log("Running secureCompare tests...");

  const testCases = [
    { a: "secret", b: "secret", expected: true, desc: "Identical strings" },
    { a: "secret", b: "wrong", expected: false, desc: "Different strings, same length" },
    { a: "secret", b: "secrets", expected: false, desc: "Different lengths (a < b)" },
    { a: "secrets", b: "secret", expected: false, desc: "Different lengths (a > b)" },
    { a: "", b: "", expected: true, desc: "Empty strings" },
    { a: "a", b: "b", expected: false, desc: "Single character difference" },
    { a: "long_string_12345", b: "long_string_12345", expected: true, desc: "Long identical strings" },
    { a: null, b: "secret", expected: false, desc: "null vs string" },
    { a: "secret", b: undefined, expected: false, desc: "string vs undefined" },
    { a: null, b: null, expected: false, desc: "null vs null" },
  ];

  let passedCount = 0;
  for (const { a, b, expected, desc } of testCases) {
    const result = secureCompare(a as any, b as any);
    if (result === expected) {
      console.log(`✅ PASS: ${desc}`);
      passedCount++;
    } else {
      console.log(`❌ FAIL: ${desc} (Expected ${expected}, got ${result})`);
    }
  }

  console.log(`\nTests finished: ${passedCount}/${testCases.length} passed.`);

  if (passedCount !== testCases.length) {
    process.exit(1);
  }
}

test();
