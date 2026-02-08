/**
 * Shopify Integration Helper
 * 
 * Future purpose:
 * - Validate HMAC signatures from webhooks
 * - Parse and normalize cart data
 * - Sync product details
 */

import { z } from "zod";
import { ShopifyCartPayload } from "../types/index.ts";


const getEnv = (key: string): string | undefined => {
  // @ts-ignore
  if (typeof Deno !== "undefined") return Deno.env.get(key);
  // @ts-ignore
  if (typeof process !== "undefined") return process.env[key];
  return undefined;
};

export const verifyShopifyWebhook = async (hmac: string, body: string): Promise<boolean> => {
  console.log('[Shopify] Verifying webhook signature...');

  const secret = getEnv("SHOPIFY_SECRET");

  if (!secret) {
    console.error("[Shopify] Missing SHOPIFY_SECRET environment variable");
    return false;
  }

  if (!hmac || !body) {
    console.warn("[Shopify] Missing HMAC header or body for verification");
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(body);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Decode the base64 HMAC signature provided by Shopify
    const signatureBytes = Uint8Array.from(atob(hmac), c => c.charCodeAt(0));

    // Verify the signature using constant-time comparison (via Web Crypto API)
    const isValid = await crypto.subtle.verify(
      "HMAC",
      cryptoKey,
      signatureBytes,
      msgData
    );

    if (!isValid) {
      console.warn("[Shopify] Webhook signature verification failed");
    } else {
      console.log("[Shopify] Webhook signature verified successfully");
    }

    return isValid;
  } catch (error) {
    console.error("[Shopify] Error verifying webhook signature:", error);
    return false;
  }
};

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

export const parseShopifyCart = (payload: any): ShopifyCartPayload => {
  return ShopifyCartSchema.parse(payload);
};
