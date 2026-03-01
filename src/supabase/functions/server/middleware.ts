import { Context, Next } from "npm:hono";
import { verify } from "npm:hono/jwt";
import { getEnv } from "../../../lib/env.ts";
import { SHOPIFY_DOMAIN_REGEX } from "./constants.ts";

// PERFORMANCE: Hoist environment variables to module level to avoid redundant lookups on every request.
// In a serverless/edge environment, these values are cached for the lifetime of the isolate.
const SHOPIFY_CLIENT_ID = getEnv("SHOPIFY_CLIENT_ID");
const SHOPIFY_JWT_PUBLIC_KEY = getEnv("SHOPIFY_JWT_PUBLIC_KEY");
const SHOPIFY_CLIENT_SECRET = getEnv("SHOPIFY_CLIENT_SECRET");

// PERFORMANCE: Pre-calculate the authentication algorithm and key to avoid logical branching on every request.
const AUTH_ALGORITHM = SHOPIFY_JWT_PUBLIC_KEY ? "RS256" : "HS256";
const PUBLIC_KEY_OR_SECRET = SHOPIFY_JWT_PUBLIC_KEY || SHOPIFY_CLIENT_SECRET;

/**
 * verifyShopifySession Middleware
 *
 * Verifies the Shopify App Bridge Session Token (JWT).
 * Enforces multi-tenancy by ensuring the requested shop matches the token's 'dest' claim.
 */
export const verifyShopifySession = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: Missing Session Token" }, 401);
  }

  const token = authHeader.split(" ")[1];

  if (!PUBLIC_KEY_OR_SECRET || !SHOPIFY_CLIENT_ID) {
    console.error("[Auth] Missing SHOPIFY_CLIENT_ID or Secret/Public Key");
    return c.json({ error: "Server Configuration Error" }, 500);
  }

  try {
    // 1. Verify JWT Signature
    // PERFORMANCE: Use pre-calculated PUBLIC_KEY_OR_SECRET and AUTH_ALGORITHM.
    const payload = await verify(token, PUBLIC_KEY_OR_SECRET, AUTH_ALGORITHM as any);

    // 2. Validate Audience (App API Key)
    if (payload.aud !== SHOPIFY_CLIENT_ID) {
      return c.json({ error: "Unauthorized: Invalid Audience" }, 401);
    }

    // 3. Extract and normalize the shop domain from the 'dest' claim
    const dest = payload.dest as string;
    const shop = new URL(dest).hostname;

    // SECURITY: Validate shop domain format to prevent SSRF or unauthorized domains
    if (!SHOPIFY_DOMAIN_REGEX.test(shop)) {
      console.error(`[Auth] Invalid shop domain in token: ${shop}`);
      return c.json({ error: "Unauthorized: Invalid shop domain" }, 401);
    }

    // 4. Multi-tenancy check: Verify that the 'shop' query param matches the token
    const requestedShop = c.req.query("shop");
    // SECURITY: Tightened multi-tenancy check to prevent unauthorized access to other shops or global data.
    if (requestedShop && requestedShop !== shop) {
      console.warn(`[Auth] Multi-tenancy breach attempt: Token for ${shop} used for ${requestedShop}`);
      return c.json({ error: "Forbidden: Shop mismatch" }, 403);
    }

    // Set the verified shop in context for downstream use
    c.set("verified_shop", shop);

    await next();
  } catch (err) {
    console.error("[Auth] Session verification failed:", err);
    return c.json({ error: "Unauthorized: Invalid Session Token" }, 401);
  }
};
