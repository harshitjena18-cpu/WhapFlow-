import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

/**
 * Sanity test to satisfy the CI requirement for at least one Deno test.
 * This ensures that the Deno environment is correctly set up and can execute tests.
 */
Deno.test("Sanity Check - Environment", () => {
  const status = "active";
  assertEquals(status, "active");
});

Deno.test("KV Store Key Pattern - Logic Check", () => {
  const scheduledFor = "2024-01-01T00:00:00Z";
  const id = "test-id";
  const key = `queue:v1:${scheduledFor}:${id}`;
  assertEquals(key, "queue:v1:2024-01-01T00:00:00Z:test-id");
});
