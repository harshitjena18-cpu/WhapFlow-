import { Hono } from "npm:hono";
import { setCookie, getCookie } from "npm:hono/cookie";
import * as kv from "./kv_store.tsx";
import { encrypt, secureCompare } from "./crypto.ts";
import { getEnv } from "../../../lib/env.ts";
import { getErrorMessage, redactPII } from "../../../lib/error.ts";
import { API_DOMAIN, APP_DOMAIN, SERVER_BASE_PATH } from "./constants.ts";
import { Buffer } from "node:buffer";

const app = new Hono();

// PERFORMANCE: Hoist encoder to avoid repeated object creation overhead
const encoder = new TextEncoder();

// Module-level cache for HMAC CryptoKeys to minimize import overhead
let _cachedHmacKey: CryptoKey | null = null;
let _cachedHmacSecret: string | null = null;
let _hmacKeyPromise: Promise<CryptoKey> | null = null;

// Configuration
const SHOPIFY_SCOPES = "read_checkouts,read_orders";
const SHOPIFY_DOMAIN_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
// Note: In production, strictly use the environment variable. 
// For this environment, we default to the provided callback URL structure if not set, 
// but the user MUST set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET.
const REDIRECT_URI = getEnv("SHOPIFY_REDIRECT_URI") || `${API_DOMAIN}/auth/shopify/callback`;

/**
 * STEP 2: OAUTH START ROUTE
 * GET /auth/shopify
 */
app.get("/", (c) => {
  const shop = c.req.query("shop");
  const clientId = getEnv("SHOPIFY_CLIENT_ID");

  if (!clientId) {
    return c.text("Error: SHOPIFY_CLIENT_ID not configured", 500);
  }

  // 1. Validate shop parameter
  if (!shop || !SHOPIFY_DOMAIN_REGEX.test(shop)) {
    return c.text("Error: Invalid or missing 'shop' parameter. Expected format: my-store.myshopify.com", 400);
  }

  // 2. Generate secure state
  const state = crypto.randomUUID();

  // 3. Store state in cookie (httpOnly, secure)
  setCookie(c, "shopify_oauth_state", state, {
    path: "/",
    secure: true,
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: "Lax",
  });

  // 4. Redirect to Shopify
  const authorizationUrl = new URL(`https://${shop}/admin/oauth/authorize`);
  authorizationUrl.searchParams.append("client_id", clientId);
  authorizationUrl.searchParams.append("scope", SHOPIFY_SCOPES);
  authorizationUrl.searchParams.append("redirect_uri", REDIRECT_URI);
  authorizationUrl.searchParams.append("state", state);

  console.log(`[OAuth] Initiating flow for ${shop}`);
  return c.redirect(authorizationUrl.toString());
});

/**
 * STEP 3: OAUTH CALLBACK ROUTE
 * GET /auth/shopify/callback
 */
app.get("/callback", async (c) => {
  const { shop, code, state, hmac } = c.req.query();
  const clientId = getEnv("SHOPIFY_CLIENT_ID");
  const clientSecret = getEnv("SHOPIFY_CLIENT_SECRET");

  // 1. Basic Validation & SSRF Protection
  if (!shop || !code || !state || !hmac) {
    return c.text("Error: Missing required parameters", 400);
  }
  if (!SHOPIFY_DOMAIN_REGEX.test(shop)) {
    return c.text("Error: Invalid shop domain", 400);
  }

  if (!clientId || !clientSecret) {
    return c.text("Error: Server misconfiguration (Missing Credentials)", 500);
  }

  // 2. Verify State
  const savedState = getCookie(c, "shopify_oauth_state");
  if (!secureCompare(state, savedState)) {
    // SECURITY: Redact state tokens in logs to prevent session hijacking or token exposure
    console.error(`[OAuth] State mismatch for shop: ${shop}`);
    return c.text("Error: Request origin cannot be verified (State Mismatch)", 403);
  }

  // SECURITY: Clear state cookie after verification to prevent reuse or replay attacks
  setCookie(c, "shopify_oauth_state", "", {
    path: "/",
    secure: true,
    httpOnly: true,
    maxAge: 0,
    sameSite: "Lax",
  });

  // 3. Verify HMAC
  const success = await verifyHmac(c.req.query(), clientSecret);
  if (!success) {
    console.error(`[OAuth] HMAC verification failed for ${shop}`);
    return c.text("Error: HMAC verification failed", 400);
  }

  try {
    // 4. Exchange Access Token
    console.log(`[OAuth] Exchanging code for token with ${shop}...`);
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      // SECURITY: Avoid logging full 'tokenData' as it may contain sensitive error details or credentials
      console.error(`[OAuth] Token exchange failed: Status ${tokenResponse.status}`);
      return c.text("Error: Failed to exchange access token", 500);
    }

    const accessToken = tokenData.access_token;
    console.log(`[OAuth] Token acquired for ${shop}`);

    // STEP 4: MERCHANT REGISTRATION
    // Update global config for MVP (Dashboard compatibility)
    // In a real multi-tenant app, this would be scoped to the user session.
    
    // PERFORMANCE: Parallelize configuration fetch and token encryption
    const shopifyKey = `shop:${shop}:config:shopify`;
    const [existingConfig, encryptedToken] = await Promise.all([
      kv.get(shopifyKey),
      encrypt(accessToken)
    ]);

    // 1. Update Scoped Config (Scoping by shop to prevent multi-tenancy leaks)
    const shopifyConfig = existingConfig || {};
    shopifyConfig.connected_at = new Date().toISOString();
    shopifyConfig.connection_status = "connected";
    shopifyConfig.shop_domain = shop; // Metadata

    // 2. Securely Store Credentials (keyed by shop)

    const merchantRecord = {
      shop: shop,
      access_token: encryptedToken,
      scopes: tokenData.scope,
      plan: "free",
      shopify_connected: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // PERFORMANCE: Batch persist both configuration and merchant record in a single request
    await kv.mset(
      [shopifyKey, `merchant:${shop}`],
      [shopifyConfig, merchantRecord]
    );
    
    // Also set a mapping if needed, or just rely on the global config for the MVP demo.

    // STEP 5: REGISTER WEBHOOKS
    await registerWebhooks(shop, accessToken);

    // STEP 6: FINAL REDIRECT
    console.log(`[OAuth] Flow complete. Redirecting to Dashboard.`);
    return c.redirect(`${APP_DOMAIN}/dashboard`);

  } catch (error) {
    // SECURITY: Use getErrorMessage to redact PII from the logged error
    console.error("[OAuth] Unexpected error:", getErrorMessage(error));
    return c.text("Internal Server Error", 500);
  }
});

/**
 * Helper: HMAC Verification
 *
 * PERFORMANCE: Implements a promise-based cache to ensure that concurrent OAuth attempts
 * only trigger a single key importation, solving the thundering herd problem.
 */
async function verifyHmac(query: Record<string, string>, secret: string) {
  const { hmac, ...rest } = query;
  if (!hmac) return false;
  
  // Sort keys alphabetically
  const keys = Object.keys(rest).sort();
  const message = keys.map(key => `${key}=${rest[key]}`).join("&");

  const msgData = encoder.encode(message);

  // PERFORMANCE: Cache the imported CryptoKey and use Singleflight pattern to avoid overhead during OAuth callback
  if (_cachedHmacSecret !== secret) {
    _cachedHmacKey = null;
    _hmacKeyPromise = null;
    _cachedHmacSecret = secret;
    _hmacKeyPromise = null;
  }

  let key: CryptoKey;
  if (_cachedHmacKey) {
    key = _cachedHmacKey;
  } else {
    if (!_hmacKeyPromise) {
      _hmacKeyPromise = (async () => {
        try {
          const keyData = encoder.encode(secret);
          _cachedHmacKey = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
          );
          return _cachedHmacKey;
        } finally {
          _hmacKeyPromise = null;
        }
      })();
    }
    key = await _hmacKeyPromise;
  }

  // Convert hex HMAC to Uint8Array for constant-time verification
  const hmacBytes = new Uint8Array(hmac.length / 2);
  for (let i = 0; i < hmac.length; i += 2) {
    hmacBytes[i / 2] = parseInt(hmac.substring(i, i + 2), 16);
  }

  // Type narrowing for TypeScript safety
  if (!key) {
    throw new Error("HMAC Key initialization failed");
  }

  return await crypto.subtle.verify("HMAC", key, hmacBytes, msgData);
}

/**
 * Helper: Register Webhooks
 */
async function registerWebhooks(shop: string, accessToken: string) {
  // Define webhooks with their specific endpoints
  const WEBHOOKS = [
    { 
      topic: "checkouts/create", 
      address: `${API_DOMAIN}${SERVER_BASE_PATH}/api/webhooks/shopify`
    },
    { 
      topic: "checkouts/update", 
      address: `${API_DOMAIN}${SERVER_BASE_PATH}/api/webhooks/shopify`
    },
    { 
      topic: "app/uninstalled", 
      address: `${API_DOMAIN}${SERVER_BASE_PATH}/api/webhooks/app/uninstalled`
    },
    {
      topic: "app_subscriptions/update",
      address: `${API_DOMAIN}${SERVER_BASE_PATH}/api/billing/webhooks/billing/update`
    }
  ];


  console.log(`[Webhooks] Registering topics for ${shop}...`);

  // PERFORMANCE: Parallelize webhook registration to reduce latency for the OAuth callback
  await Promise.all(WEBHOOKS.map(async (hook) => {
    try {
      const response = await fetch(`https://${shop}/admin/api/2023-10/webhooks.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({
          webhook: {
            topic: hook.topic,
            address: hook.address,
            format: "json",
          },
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Ignore "address for this topic has already been taken" errors
        if (JSON.stringify(data).includes("taken")) {
             console.log(`[Webhooks] Topic ${hook.topic} already registered.`);
        } else {
             // SECURITY: Redact potential PII from Shopify error response before logging
             console.error(`[Webhooks] Failed to register ${hook.topic}:`, redactPII(JSON.stringify(data)));
        }
      } else {
        console.log(`[Webhooks] Successfully registered ${hook.topic}`);
      }
    } catch (err) {
      // SECURITY: Redact PII from the network error before logging
      console.error(`[Webhooks] Network error registering ${hook.topic}:`, getErrorMessage(err));
    }
  }));
}

export default app;
