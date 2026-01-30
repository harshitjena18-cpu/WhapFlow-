/**
 * Shopify Integration Helper
 * 
 * Future purpose:
 * - Validate HMAC signatures from webhooks
 * - Parse and normalize cart data
 * - Sync product details
 */

import { ShopifyCartPayload } from "../types";

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
  // TODO: Implement safe parsing and validation (e.g. using Zod)
  return payload as ShopifyCartPayload;
};
