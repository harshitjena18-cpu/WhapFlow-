import { secureCompare } from "../src/supabase/functions/server/crypto.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("secureCompare - equality", () => {
  assertEquals(secureCompare("secret", "secret"), true, "Should return true for identical strings");
  assertEquals(secureCompare("", ""), true, "Should return true for empty strings");
  assertEquals(secureCompare("longer_secret_123", "longer_secret_123"), true, "Should return true for identical long strings");
});

Deno.test("secureCompare - inequality", () => {
  assertEquals(secureCompare("secret", "wrong"), false, "Should return false for different strings");
  assertEquals(secureCompare("secret", "secre"), false, "Should return false for strings with one character difference");
  assertEquals(secureCompare("secret", "secrets"), false, "Should return false for strings with different lengths");
  assertEquals(secureCompare("abc", "def"), false, "Should return false for completely different strings");
});

Deno.test("secureCompare - null/undefined handling", () => {
  assertEquals(secureCompare(null as any, "secret"), false, "Should return false if first argument is null");
  assertEquals(secureCompare("secret", undefined as any), false, "Should return false if second argument is undefined");
  assertEquals(secureCompare(null as any, undefined as any), false, "Should return false if both arguments are non-strings");
});

Deno.test("secureCompare - length leakage prevention (logic check)", () => {
  // While we can't easily measure timing here, we can verify that the function
  // handles different lengths without crashing or returning incorrect results.
  const base = "a".repeat(100);
  const shorter = "a".repeat(50);
  const longer = "a".repeat(150);

  assertEquals(secureCompare(base, shorter), false, "Should handle shorter comparison");
  assertEquals(secureCompare(base, longer), false, "Should handle longer comparison");
  assertEquals(secureCompare(base, base), true, "Should handle exact length comparison");
});
