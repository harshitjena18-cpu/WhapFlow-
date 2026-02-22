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
  console.log("🛡️ Starting Security Hardening Verification Tests...");

  const shop = "test-store.myshopify.com";
  const payload = {
    iss: `https://${shop}/admin`,
    dest: `https://${shop}`,
    aud: SHOPIFY_CLIENT_ID,
    sub: "user_123",
    exp: Math.floor(Date.now() / 1000) + 60,
  };

  // Using HS256 for testing simplicity
  const token = await sign(payload, SHOPIFY_CLIENT_SECRET, "HS256");

  // Helper to create mock context
  const createMockContext = (authHeader: string | null, queryShop: string | null) => {
    let responseStatus = 200;
    let responseData = {};
    return {
      req: {
        header: (name: string) => name === "Authorization" ? authHeader : null,
        query: (name: string) => name === "shop" ? queryShop : null,
      },
      json: (data: any, status: number) => {
          responseStatus = status;
          responseData = data;
          return { data, status };
      },
      set: (key: string, value: any) => {
          // console.log(`   Context Set: ${key} = ${value}`);
      },
      get: (key: string) => {
          if (key === "responseStatus") return responseStatus;
          if (key === "responseData") return responseData;
          return null;
      }
    } as unknown as Context;
  };

  // 1. Test Invalid Shop Domain in Token (dest claim)
  console.log("\n[TEST 1] Invalid Shop Domain in Token - Expected: 401 Unauthorized");
  const tokenInvalidDomain = await sign({ ...payload, dest: "https://attacker.com" }, SHOPIFY_CLIENT_SECRET, "HS256");
  const ctx1 = createMockContext(`Bearer ${tokenInvalidDomain}`, "attacker.com");
  let nextCalled = false;
  await verifyShopifySession(ctx1, async () => { nextCalled = true; });
  console.log(`   Status: ${(ctx1 as any).get("responseStatus")}, Next Called: ${nextCalled}`);

  // 2. Test Multi-tenancy Mismatch
  console.log("\n[TEST 2] Multi-tenancy Mismatch - Expected: 403 Forbidden");
  const ctx2 = createMockContext(`Bearer ${token}`, "other-store.myshopify.com");
  nextCalled = false;
  await verifyShopifySession(ctx2, async () => { nextCalled = true; });
  console.log(`   Status: ${(ctx2 as any).get("responseStatus")}, Next Called: ${nextCalled}`);

  // 3. Test Global Shop Bypass Attempt
  console.log("\n[TEST 3] Global Shop Bypass Attempt - Expected: 403 Forbidden");
  const ctx3 = createMockContext(`Bearer ${token}`, "global");
  nextCalled = false;
  await verifyShopifySession(ctx3, async () => { nextCalled = true; });
  console.log(`   Status: ${(ctx3 as any).get("responseStatus")}, Next Called: ${nextCalled}`);

  // 4. Test Valid Token and Matching Shop
  console.log("\n[TEST 4] Valid Token and Matching Shop - Expected: Success (Next Called)");
  const ctx4 = createMockContext(`Bearer ${token}`, shop);
  nextCalled = false;
  await verifyShopifySession(ctx4, async () => { nextCalled = true; });
  console.log(`   Status: ${(ctx4 as any).get("responseStatus")}, Next Called: ${nextCalled}`);

  console.log("\n✅ Security Hardening Verification Tests Complete.");
}

runTests().catch(err => {
    console.error("❌ Test Runner Error:", err);
    process.exit(1);
});
