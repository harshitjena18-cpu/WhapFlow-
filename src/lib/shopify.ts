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
import { getEnv } from "./env.ts";

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

export const verifyShopifyWebhook = async (hmac: string, body: string): Promise<boolean> => {
  console.log('[Shopify] Verifying webhook signature...');

  const secret = getEnv("SHOPIFY_SECRET");

  if (!secret) {
    console.error("[Shopify] Verification failed: SHOPIFY_SECRET is not set.");
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(body);

    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureBytes = Uint8Array.from(atob(hmac), (c) => c.charCodeAt(0));

    return await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      msgData
    );
  } catch (error) {
    console.error("[Shopify] Verification failed:", error);
    return false;
  }
};
