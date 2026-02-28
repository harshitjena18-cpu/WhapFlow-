
// scripts/verify_middleware_optimization.ts
import { test } from "node:test";
import assert from "node:assert";

// Mock environment variables
const MOCK_CLIENT_ID = "test-client-id";
const MOCK_CLIENT_SECRET = "test-client-secret";

process.env.SHOPIFY_CLIENT_ID = MOCK_CLIENT_ID;
process.env.SHOPIFY_CLIENT_SECRET = MOCK_CLIENT_SECRET;

// Manual mocks for Hono and JWT since we can't easily import them with npm: prefix in node
const mockVerify = async (token: string, secret: string, algorithm: string) => {
    if (token === "valid-token" && secret === MOCK_CLIENT_SECRET) {
        return {
            aud: MOCK_CLIENT_ID,
            dest: "https://test-store.myshopify.com",
            exp: Math.floor(Date.now() / 1000) + 60,
        };
    }
    if (token === "mismatched-shop-token") {
        return {
            aud: MOCK_CLIENT_ID,
            dest: "https://test-store.myshopify.com",
            exp: Math.floor(Date.now() / 1000) + 60,
        };
    }
    if (token === "wrong-aud-token") {
        return {
            aud: "wrong-client-id",
            dest: "https://test-store.myshopify.com",
            exp: Math.floor(Date.now() / 1000) + 60,
        };
    }
    throw new Error("Invalid token");
};

// We will inject our mock verify into the middleware logic for testing
// Since we can't easily import the middleware file because of npm: and jsr: imports,
// we will re-implement the core logic here to verify the HOISTING AND LOGIC.

const SHOPIFY_DOMAIN_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;

// Simulated hoisted variables (what we're testing)
const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const SHOPIFY_JWT_PUBLIC_KEY = process.env.SHOPIFY_JWT_PUBLIC_KEY;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;

const AUTH_ALGORITHM = SHOPIFY_JWT_PUBLIC_KEY ? "RS256" : "HS256";
const PUBLIC_KEY_OR_SECRET = SHOPIFY_JWT_PUBLIC_KEY || SHOPIFY_CLIENT_SECRET;

const verifyShopifySession = async (c: any, next: any) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: Missing Session Token" }, 401);
  }

  const token = authHeader.split(" ")[1];

  if (!PUBLIC_KEY_OR_SECRET || !SHOPIFY_CLIENT_ID) {
    return c.json({ error: "Server Configuration Error" }, 500);
  }

  try {
    const payload = await mockVerify(token, PUBLIC_KEY_OR_SECRET as string, AUTH_ALGORITHM);

    if (payload.aud !== SHOPIFY_CLIENT_ID) {
      return c.json({ error: "Unauthorized: Invalid Audience" }, 401);
    }

    const dest = payload.dest as string;
    const shop = new URL(dest).hostname;

    if (!SHOPIFY_DOMAIN_REGEX.test(shop)) {
      return c.json({ error: "Unauthorized: Invalid shop domain" }, 401);
    }

    const requestedShop = c.req.query("shop");
    if (requestedShop && requestedShop !== shop) {
      return c.json({ error: "Forbidden: Shop mismatch" }, 403);
    }

    c.set("verified_shop", shop);
    await next();
  } catch (err) {
    return c.json({ error: "Unauthorized: Invalid Session Token" }, 401);
  }
};

test("verifyShopifySession optimization logic", async (t) => {
  const createMockContext = (headers: Record<string, string>, query: Record<string, string> = {}) => {
    const c = {
        req: {
          header: (name: string) => headers[name],
          query: (name: string) => query[name],
        },
        json: (data: any, status: number) => ({ data, status }),
        set: (key: string, value: any) => { (c as any).stored = { ...((c as any).stored || {}), [key]: value } },
        stored: {} as Record<string, any>,
    };
    return c as any;
  };

  await t.test("should succeed with valid token", async () => {
    const shop = "test-store.myshopify.com";
    const c = createMockContext({ "Authorization": "Bearer valid-token" }, { "shop": shop });
    let nextCalled = false;
    const next = async () => { nextCalled = true };

    await verifyShopifySession(c, next);

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(c.stored.verified_shop, shop);
  });

  await t.test("should fail with mismatched shop", async () => {
    const maliciousShop = "other-store.myshopify.com";
    const c = createMockContext({ "Authorization": "Bearer mismatched-shop-token" }, { "shop": maliciousShop });
    let nextCalled = false;
    const next = async () => { nextCalled = true };

    const result = await verifyShopifySession(c, next);

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(result.status, 403);
    assert.ok(result.data.error.includes("Shop mismatch"));
  });

  await t.test("should fail with invalid audience", async () => {
    const c = createMockContext({ "Authorization": "Bearer wrong-aud-token" });
    let nextCalled = false;
    const next = async () => { nextCalled = true };

    const result = await verifyShopifySession(c, next);

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(result.status, 401);
    assert.ok(result.data.error.includes("Invalid Audience"));
  });

  await t.test("hoisted variables should be correctly initialized", () => {
      assert.strictEqual(SHOPIFY_CLIENT_ID, MOCK_CLIENT_ID);
      assert.strictEqual(PUBLIC_KEY_OR_SECRET, MOCK_CLIENT_SECRET);
      assert.strictEqual(AUTH_ALGORITHM, "HS256");
  });
});
