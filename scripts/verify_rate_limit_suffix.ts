import assert from "node:assert";

// Function to generate rate limit key
function generateRateLimitKey(shop: string, ip: string, date: Date): string {
  const currentHour = date.toISOString().slice(0, 13);
  return `rate_limit:ai_gen:${shop}:${ip}:${currentHour}`;
}

// Function to check rate limit logic
function checkRateLimit(hits: number, limit: number): boolean {
  return hits >= limit;
}

// Test cases
try {
  console.log("Running Rate Limit Tests...");

  const shop = "test-shop.myshopify.com";
  const ip = "127.0.0.1";
  const date = new Date("2023-10-27T10:30:00Z");

  const key = generateRateLimitKey(shop, ip, date);
  assert.strictEqual(key, "rate_limit:ai_gen:test-shop.myshopify.com:127.0.0.1:2023-10-27T10");

  const date2 = new Date("2023-10-27T10:59:59Z");
  const key2 = generateRateLimitKey(shop, ip, date2);
  assert.strictEqual(key2, "rate_limit:ai_gen:test-shop.myshopify.com:127.0.0.1:2023-10-27T10");

  const date3 = new Date("2023-10-27T11:00:00Z");
  const key3 = generateRateLimitKey(shop, ip, date3);
  assert.strictEqual(key3, "rate_limit:ai_gen:test-shop.myshopify.com:127.0.0.1:2023-10-27T11");

  const limit = 10;

  assert.strictEqual(checkRateLimit(0, limit), false);
  assert.strictEqual(checkRateLimit(9, limit), false);
  assert.strictEqual(checkRateLimit(10, limit), true); // Should block on 11th request
  assert.strictEqual(checkRateLimit(11, limit), true);

  console.log("✅ All tests passed!");
} catch (e) {
  console.error("❌ Test failed:", e);
  process.exit(1);
}
