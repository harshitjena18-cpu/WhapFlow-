import * as kv from "./kv_store.tsx";
import { decrypt } from "./crypto.ts";
import { Merchant } from "./types.ts";
import { Buffer } from "node:buffer";
import { redactPII, getErrorMessage } from "../../../lib/error.ts";

// PERFORMANCE: Hoist encoders to minimize object creation overhead in the webhook hot-path
const ENCODER = new TextEncoder();

// Module-level cache for HMAC CryptoKeys to minimize import overhead (~2-5ms per call)
let _cachedHmacKey: CryptoKey | null = null;
let _cachedHmacSecret: string | null = null;

/**
 * Utility to escape special characters in Shopify search queries to prevent injection.
 * Escapes backslashes and double quotes.
 */
export function escapeShopifySearch(value: string): string {
  return value.replace(/([\\"])/g, "\\$1");
}

/**
 * Retrieve merchant credentials from KV
 *
 * PERFORMANCE: Supports an optional pre-fetched merchant object to avoid redundant database round-trips.
 */
export async function getMerchantCredentials(
  shop: string,
  preFetchedMerchant?: Merchant | null,
): Promise<Merchant | null> {
  const merchant =
    preFetchedMerchant !== undefined
      ? preFetchedMerchant
      : ((await kv.get(`merchant:${shop}`)) as Merchant | null);
  if (merchant && merchant.access_token) {
    // Decrypt the token if it was stored encrypted
    merchant.access_token = await decrypt(merchant.access_token);
  }
  return merchant;
}

/**
 * Check if an abandoned cart has been converted to an order.
 * This is a mandatory safety check to prevent spam.
 */
export async function checkOrderExists(
  shop: string,
  accessToken: string,
  cartCreatedAt: string,
  email?: string,
  phone?: string,
): Promise<boolean> {
  try {
    // 1. Build Query
    // Construct search query: created_at:>=... AND (email:... OR phone:...)
    // Include status:open OR status:closed OR status:cancelled to catch ALL orders
    const clauses = [
      `created_at:>=${cartCreatedAt}`,
      `(status:open OR status:closed OR status:cancelled)`,
    ];

    const contactClauses = [];
    // Quote and escape values to handle spaces and prevent injection
    if (email) contactClauses.push(`email:"${escapeShopifySearch(email)}"`);
    if (phone) contactClauses.push(`phone:"${escapeShopifySearch(phone)}"`);

    if (contactClauses.length > 0) {
      clauses.push(`(${contactClauses.join(" OR ")})`);
    } else {
      console.warn(
        `[ShopifyClient] No contact info to check order for ${shop}`,
      );
      return true; // Fail safe: assume order exists/risk of spam
    }

    const searchQuery = clauses.join(" AND ");

    // Only request 'id' and 'first: 1' for maximum efficiency
    const query = `
      query checkOrders($query: String!) {
        orders(first: 1, query: $query) {
          nodes {
            id
          }
        }
      }
    `;

    // 2. Call Shopify GraphQL API
    const data = await shopifyGraphql(shop, accessToken, query, {
      query: searchQuery,
    });
    const orders = data.orders.nodes || [];

    if (orders.length > 0) {
      // SECURITY: Redact contact info in logs
      console.log(
        `[ShopifyClient] MATCH FOUND: Order exists for [REDACTED CONTACT INFO] in ${shop}`,
      );
      return true;
    }

    return false;
  } catch (error) {
    // SECURITY: Redact PII from error messages before logging
    console.error(
      `[ShopifyClient] Error checking orders for ${shop}:`,
      getErrorMessage(error),
    );
    // FAIL SAFE: If error, assume order exists to block message
    return true;
  }
}

/**
 * Verify HMAC for Webhooks (Body-based)
 * Uses constant-time comparison to prevent timing attacks.
 */
export async function verifyWebhookHmac(
  rawBody: string,
  hmacHeader: string,
  secret: string,
): Promise<boolean> {
  if (!rawBody || !hmacHeader || !secret) return false;

  try {
    const msgData = ENCODER.encode(rawBody);

    // PERFORMANCE: Cache the imported CryptoKey to avoid ~2-5ms overhead of importKey per call
    if (_cachedHmacSecret !== secret || !_cachedHmacKey) {
      const keyData = ENCODER.encode(secret);
      _cachedHmacKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"],
      );
      _cachedHmacSecret = secret;
    }

    // Shopify webhooks use base64 for the HMAC header
    const signatureBytes = Buffer.from(hmacHeader, "base64");

    // Type narrowing for TypeScript safety
    if (!_cachedHmacKey) {
      throw new Error("HMAC Key initialization failed");
    }

    return await crypto.subtle.verify(
      "HMAC",
      _cachedHmacKey,
      signatureBytes,
      msgData,
    );
  } catch (error) {
    console.error("[ShopifyClient] HMAC verification error:", error);
    return false;
  }
}

/**
 * Execute a GraphQL query/mutation against the Shopify Admin API
 */
export async function shopifyGraphql(
  shop: string,
  accessToken: string,
  query: string,
  variables: Record<string, any> = {},
) {
  // SECURITY: Defense-in-depth validation of shop domain to prevent SSRF
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop)) {
    throw new Error(`Invalid shop domain: ${shop}`);
  }

  try {
    const response = await fetch(
      `https://${shop}/admin/api/2024-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      // SECURITY: Avoid logging full 'result' as it may contain PII from the query or sensitive error details
      console.error(`[ShopifyGraphQL] HTTP Error: ${response.status}`);
      throw new Error(`Shopify GraphQL HTTP Error: ${response.status}`);
    }

    // Check for userErrors (common in mutations) but don't throw, let caller handle
    // However, if there are top-level "errors", we should probably throw or return them.
    if (result.errors && result.errors.length > 0) {
      // SECURITY: Avoid logging the full 'errors' object as it contains PII (query strings/variables)
      console.error(
        `[ShopifyGraphQL] GraphQL Errors: ${result.errors.length} errors occurred`,
      );

      // Aggregate all error messages and redact PII
      const errorMessages = result.errors
        .map((e: any) => e.message || "Unknown GraphQL Error")
        .join("; ");
      throw new Error(`GraphQL Error: ${redactPII(errorMessages)}`);
    }

    return result.data;
  } catch (error) {
    // SECURITY: Use getErrorMessage to redact PII from the logged error
    console.error(
      `[ShopifyGraphQL] Network/System Error for ${shop}:`,
      getErrorMessage(error),
    );
    throw error;
  }
}
