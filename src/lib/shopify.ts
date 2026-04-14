/**
 * Shopify Integration Helper
 * 
 * - Validate HMAC signatures from webhooks
 * - Parse and normalize cart data
 * - Sync product details
 */

import { z } from "zod";
import { getEnv } from "./env.ts";
import { ShopifyCartPayload } from "../types/index.ts";

const ShopifyLineItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  quantity: z.number(),
  price: z.coerce.string(),
});

const ShopifyCustomerSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
});

export const ShopifyCartSchema = z.object({
  id: z.coerce.string(),
  token: z.string(),
  line_items: z.array(ShopifyLineItemSchema),
  currency: z.string(),
  customer: ShopifyCustomerSchema,
  abandoned_checkout_url: z.string().url(),
  created_at: z.string(),
});

export const parseShopifyCart = (payload: unknown): ShopifyCartPayload => {
  return ShopifyCartSchema.parse(payload);
};

// PERFORMANCE: Hoist encoder to avoid redundant object creation
const encoder = new TextEncoder();

// Module-level cache for HMAC CryptoKeys
let _cachedHmacKey: CryptoKey | null = null;
let _cachedHmacSecret: string | null = null;
let _hmacKeyPromise: Promise<CryptoKey> | null = null;

export const verifyShopifyWebhook = async (hmac: string, body: string): Promise<boolean> => {
  console.log('[Shopify] Verifying webhook signature...');

  const secret = getEnv("SHOPIFY_SECRET");

  if (!secret) {
    console.error("[Shopify] Missing SHOPIFY_SECRET");
    return false;
  }

  try {
    const bodyBytes = encoder.encode(body);

    // PERFORMANCE: Cache the imported CryptoKey and use Singleflight pattern
    if (_cachedHmacSecret !== secret) {
      _cachedHmacKey = null;
      _hmacKeyPromise = null;
      _cachedHmacSecret = secret;
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

    if (!key) {
      throw new Error("HMAC Key initialization failed");
    }

    const signatureBytes = Uint8Array.from(atob(hmac), c => c.charCodeAt(0));

    return await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      bodyBytes
    );
  } catch (e) {
    console.error("[Shopify] Verification failed:", e);
    return false;
  }
};
