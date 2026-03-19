/**
 * Shopify Integration Helper
 * 
 * - Validate HMAC signatures from webhooks
 * - Parse and normalize cart data
 * - Sync product details
 */

import { z } from "zod";
import { getEnv } from "./env.ts";

export interface ShopifyCartPayload {
  id: string;
  token: string;
  line_items: Array<{
    id: number;
    title: string;
    quantity: number;
    price: string;
  }>;
  currency: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  abandoned_checkout_url: string;
  created_at: string;
}

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
    console.error("[Shopify] Missing SHOPIFY_SECRET");
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureBytes = Uint8Array.from(atob(hmac), c => c.charCodeAt(0));
    const bodyBytes = encoder.encode(body);

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
