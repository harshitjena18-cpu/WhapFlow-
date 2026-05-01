
import { secureCompare } from "../src/supabase/functions/server/crypto.ts";

function test(name: string, a: any, b: any, expected: boolean) {
  const result = secureCompare(a, b);
  if (result === expected) {
    console.log(`✅ PASS: ${name}`);
  } else {
    console.error(`❌ FAIL: ${name} (Expected ${expected}, got ${result})`);
    process.exit(1);
  }
}

console.log("--- Testing secureCompare ---");

test("Identical strings", "hello", "hello", true);
test("Different strings (same length)", "hello", "world", false);
test("Different strings (different length)", "hello", "hello world", false);
test("One string is prefix of another", "hello", "hellooo", false);
test("Empty strings", "", "", true);
test("One empty string", "hello", "", false);
test("Null vs String", null as any, "hello", false);
test("Undefined vs String", undefined as any, "hello", false);
test("Null vs Null", null as any, null as any, false);

console.log("\n✨ All secureCompare tests passed!");
