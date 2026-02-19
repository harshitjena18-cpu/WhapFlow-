import { Context } from "hono";
import { sign } from "hono/jwt";
// Use relative path for local testing with tsx
import { verifyShopifySession } from "../src/supabase/functions/server/middleware.ts";

const SHOPIFY_CLIENT_ID = "test_client_id";
const SHOPIFY_CLIENT_SECRET = "test_client_secret";

// Mock environment variables for getEnv
process.env.SHOPIFY_CLIENT_ID = SHOPIFY_CLIENT_ID;
process.env.SHOPIFY_CLIENT_SECRET = SHOPIFY_CLIENT_SECRET;

async function runTests() {
  console.log("🛡️ Starting Session Verification Tests...");

  const shop = "test-store.myshopify.com";
  const payload = {
    iss: `https://${shop}/admin`,
    dest: `https://${shop}`,
    aud: SHOPIFY_CLIENT_ID,
    sub: "user_123",
    exp: Math.floor(Date.now() / 1000) + 60,
  };

  // Using HS256 for testing simplicity (supported by the middleware as fallback)
  const token = await sign(payload, SHOPIFY_CLIENT_SECRET, "HS256");

  // 1. Test Valid Token
  console.log("\n[TEST 1] Valid Token - Expected: Success (Next Called)");
  const mockContextValid = {
    req: {
      header: (name: string) => name === "Authorization" ? `Bearer ${token}` : null,
      query: (name: string) => name === "shop" ? shop : null,
    },
    json: (data: any, status: number) => {
        console.log(`   Response: ${status}`, JSON.stringify(data));
        return { data, status };
    },
    set: (key: string, value: any) => {
        console.log(`   Context Set: ${key} = ${value}`);
    }
  } as unknown as Context;

  let nextCalled = false;
  await verifyShopifySession(mockContextValid, async () => { nextCalled = true; });
  console.log(`   Next Called: ${nextCalled}`);

  // 2. Test Invalid Audience
  console.log("\n[TEST 2] Invalid Audience - Expected: 401 Unauthorized");
  const tokenInvalidAud = await sign({ ...payload, aud: "wrong_aud" }, SHOPIFY_CLIENT_SECRET, "HS256");
  const mockContextInvalidAud = {
    req: {
      header: (name: string) => name === "Authorization" ? `Bearer ${tokenInvalidAud}` : null,
      query: (name: string) => name === "shop" ? shop : null,
    },
    json: (data: any, status: number) => {
        console.log(`   Response: ${status}`, JSON.stringify(data));
        return { data, status };
    },
    set: () => {}
  } as unknown as Context;

  nextCalled = false;
  await verifyShopifySession(mockContextInvalidAud, async () => { nextCalled = true; });
  console.log(`   Next Called: ${nextCalled}`);

  // 3. Test Shop Mismatch (Multi-tenancy breach attempt)
  console.log("\n[TEST 3] Shop Mismatch - Expected: 403 Forbidden");
  const mockContextMismatch = {
    req: {
      header: (name: string) => name === "Authorization" ? `Bearer ${token}` : null,
      query: (name: string) => name === "shop" ? "attacker-store.myshopify.com" : null,
    },
    json: (data: any, status: number) => {
        console.log(`   Response: ${status}`, JSON.stringify(data));
        return { data, status };
    },
    set: () => {}
  } as unknown as Context;

  nextCalled = false;
  await verifyShopifySession(mockContextMismatch, async () => { nextCalled = true; });
  console.log(`   Next Called: ${nextCalled}`);

  // 4. Test Missing Token
  console.log("\n[TEST 4] Missing Token - Expected: 401 Unauthorized");
  const mockContextMissing = {
    req: {
      header: () => null,
      query: () => shop,
    },
    json: (data: any, status: number) => {
        console.log(`   Response: ${status}`, JSON.stringify(data));
        return { data, status };
    },
    set: () => {}
  } as unknown as Context;

  nextCalled = false;
  await verifyShopifySession(mockContextMissing, async () => { nextCalled = true; });
  console.log(`   Next Called: ${nextCalled}`);

  console.log("\n✅ Verification Tests Complete.");
}

runTests().catch(err => {
    console.error("❌ Test Runner Error:", err);
    process.exit(1);
});
