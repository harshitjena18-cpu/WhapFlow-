/**
 * Shopify Integration Helper
 * 
 * Future purpose:
 * - Validate HMAC signatures from webhooks
 * - Parse and normalize cart data
 * - Sync product details
 */

import { z } from 'zod';
import { ShopifyCartPayload } from "../types";

export const verifyShopifyWebhook = async (hmac: string, body: string): Promise<boolean> => {
  // TODO: Implement HMAC SHA256 verification using process.env.SHOPIFY_SECRET
  console.log('[Shopify] Verifying webhook signature...');
  return true;
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
