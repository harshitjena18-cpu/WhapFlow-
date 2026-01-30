/**
 * Shopify Integration Helper
 * 
 * Future purpose:
 * - Validate HMAC signatures from webhooks
 * - Parse and normalize cart data
 * - Sync product details
 */

import { z } from "zod";
import { ShopifyCartPayload } from "../types";

const shopifyCartSchema = z.object({
  id: z.coerce.string(),
  token: z.string(),
  line_items: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      quantity: z.number(),
      price: z.coerce.string(),
    })
  ),
  currency: z.string(),
  customer: z.object({
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
    phone: z.string().optional(),
  }),
  abandoned_checkout_url: z.string(),
  created_at: z.string(),
});

export const verifyShopifyWebhook = async (hmac: string, body: string): Promise<boolean> => {
  const secret = process.env.SHOPIFY_SECRET;
  if (!secret) {
    console.error('[Shopify] Missing SHOPIFY_SECRET environment variable');
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
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
    const hashArray = Array.from(new Uint8Array(signature));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));

    return hashBase64 === hmac;
  } catch (error) {
    console.error('[Shopify] Error verifying webhook signature:', error);
    return false;
  }
};

export const parseShopifyCart = (payload: any): ShopifyCartPayload => {
  // Safe parsing and validation using Zod
  return shopifyCartSchema.parse(payload) as ShopifyCartPayload;
};
