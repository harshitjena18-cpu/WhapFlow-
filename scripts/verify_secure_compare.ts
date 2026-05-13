
import { secureCompare } from "../src/supabase/functions/server/crypto.ts";
import assert from "node:assert";

async function testSecureCompare() {
  console.log("Testing secureCompare...");

  // 1. Identical strings
  assert.strictEqual(secureCompare("secret123", "secret123"), true, "Identical strings should match");

  // 2. Different strings, same length
  assert.strictEqual(secureCompare("secret123", "secret456"), false, "Different strings (same length) should not match");

  // 3. Different strings, different length
  assert.strictEqual(secureCompare("secret123", "secret1234"), false, "Different strings (different length) should not match");

  // 4. Null/Undefined cases
  assert.strictEqual(secureCompare(null, "secret123"), false, "Null vs string should not match");
  assert.strictEqual(secureCompare("secret123", undefined), false, "String vs undefined should not match");
  assert.strictEqual(secureCompare(null, null), false, "Null vs null should return false (type check)");

  // 5. Empty strings
  assert.strictEqual(secureCompare("", ""), true, "Empty strings should match");

  // 6. Long strings
  const long1 = "a".repeat(10000);
  const long2 = "a".repeat(10000);
  const long3 = "a".repeat(9999) + "b";
  assert.strictEqual(secureCompare(long1, long2), true, "Long identical strings should match");
  assert.strictEqual(secureCompare(long1, long3), false, "Long different strings should not match");

  console.log("✅ All secureCompare tests passed!");
}

testSecureCompare().catch(err => {
  console.error("❌ Tests failed:", err);
  process.exit(1);
});
