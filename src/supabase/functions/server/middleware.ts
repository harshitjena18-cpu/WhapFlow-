import { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { getEnv } from "../../../lib/env.ts";
import { SHOPIFY_DOMAIN_REGEX } from "./constants.ts";

// Module-level cache for configuration to avoid redundant getEnv lookups on every request
let _cachedClientId: string | undefined;
let _cachedPublicKeyOrSecret: string | undefined;
let _cachedAlgorithm: string | undefined;

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

  // PERFORMANCE: Use module-level cache for environment variables to avoid repeated globalThis lookups
  if (!_cachedClientId) _cachedClientId = getEnv("SHOPIFY_CLIENT_ID");
  if (!_cachedPublicKeyOrSecret) {
    const pubKey = getEnv("SHOPIFY_JWT_PUBLIC_KEY");
    _cachedPublicKeyOrSecret = pubKey || getEnv("SHOPIFY_CLIENT_SECRET");
    _cachedAlgorithm = pubKey ? "RS256" : "HS256";
  }

  const clientId = _cachedClientId;
  const publicKeyOrSecret = _cachedPublicKeyOrSecret;
  const algorithm = _cachedAlgorithm;

  if (!publicKeyOrSecret || !clientId) {
    console.error("[Auth] Missing SHOPIFY_CLIENT_ID or Secret/Public Key");
    return c.json({ error: "Server Configuration Error" }, 500);
  }

  try {
    // 1. Verify JWT Signature
    const payload = await verify(token, publicKeyOrSecret, algorithm as any);

    // 2. Validate Audience (App API Key)
    if (payload.aud !== clientId) {
      return c.json({ error: "Unauthorized: Invalid Audience" }, 401);
    }

    // 3. Extract and normalize the shop domain from the 'dest' claim
    // PERFORMANCE: Optimized string manipulation to extract hostname without the overhead of 'new URL()'
    // This reduces latency in the request-level middleware hot path.
    const dest = payload.dest as string;
    const shop = dest.replace(/^https?:\/\//, '').split('/')[0];

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
