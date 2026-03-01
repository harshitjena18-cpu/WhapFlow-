import { writeFileSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { Buffer } from "node:buffer";
import crypto from "node:crypto";

const SHOPIFY_CLIENT_ID = "test_client_id";
const SHOPIFY_CLIENT_SECRET = "test_client_secret";

// Mock environment variables for getEnv
process.env.SHOPIFY_CLIENT_ID = SHOPIFY_CLIENT_ID;
process.env.SHOPIFY_CLIENT_SECRET = SHOPIFY_CLIENT_SECRET;

/**
 * Minimal HS256 JWT Signer for Node.js
 */
function signHS256(payload: any, secret: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encode = (obj: any) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const head = encode(header);
  const pay = encode(payload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${head}.${pay}`)
    .digest("base64url");
  return `${head}.${pay}.${signature}`;
}

/**
 * Mock Hono and JWT for testing
 */
const honoMock = `
export const verify = async (token, secret, alg) => {
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

  if (payload.aud !== process.env.SHOPIFY_CLIENT_ID) throw new Error("Invalid Audience");

  return payload;
};
`;

async function runTests() {
  console.log("⚡ Starting Middleware Optimization Verification...");

  const tempMiddlewarePath = join(process.cwd(), "scripts/temp_middleware.ts");
  const tempHonoPath = join(process.cwd(), "scripts/temp_hono_mock.ts");

  // 1. Create Hono mock
  writeFileSync(tempHonoPath, honoMock);

  // 2. Prepare temporary middleware file with mocks
  const originalPath = join(process.cwd(), "src/supabase/functions/server/middleware.ts");
  let content = readFileSync(originalPath, "utf-8");

  // Redirect imports to mocks
  content = content.replace('import { Context, Next } from "npm:hono";', 'type Context = any; type Next = any;');
  content = content.replace('import { verify } from "npm:hono/jwt";', 'import { verify } from "./temp_hono_mock.ts";');
  content = content.replace('from "../../../lib/env.ts"', 'from "../src/lib/env.ts"');
  content = content.replace('from "./constants.ts"', 'from "../src/supabase/functions/server/constants.ts"');

  writeFileSync(tempMiddlewarePath, content);

  try {
    const { verifyShopifySession } = await import("./temp_middleware.ts" as any);

    const shop = "test-store.myshopify.com";
    const payload = {
      iss: `https://${shop}/admin`,
      dest: `https://${shop}`,
      aud: SHOPIFY_CLIENT_ID,
      sub: "user_123",
      exp: Math.floor(Date.now() / 1000) + 60,
    };

    const token = signHS256(payload, SHOPIFY_CLIENT_SECRET);

    // 1. Test Valid Token
    console.log("\n[TEST 1] Valid Token - Expected: Success");
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
    } as any;

    let nextCalled = false;
    await verifyShopifySession(mockContextValid, async () => { nextCalled = true; });

    if (nextCalled) {
      console.log("   ✅ SUCCESS: Next called for valid token");
    } else {
      console.log("   ❌ FAILED: Next not called for valid token");
      process.exit(1);
    }

    // 2. Test Multi-tenancy Breach (Shop Mismatch)
    console.log("\n[TEST 2] Shop Mismatch - Expected: 403 Forbidden");
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
    } as any;

    nextCalled = false;
    const resMismatch = await verifyShopifySession(mockContextMismatch, async () => { nextCalled = true; });

    if (!nextCalled && resMismatch.status === 403) {
      console.log("   ✅ SUCCESS: Multi-tenancy breach blocked with 403");
    } else {
      console.log("   ❌ FAILED: Multi-tenancy breach NOT blocked correctly");
      process.exit(1);
    }

    console.log("\n✨ All Verification Tests Passed!");

  } finally {
    try { unlinkSync(tempMiddlewarePath); } catch (e) {}
    try { unlinkSync(tempHonoPath); } catch (e) {}
  }
}

runTests().catch(err => {
  console.error("❌ Verification Failed:", err);
  process.exit(1);
});
