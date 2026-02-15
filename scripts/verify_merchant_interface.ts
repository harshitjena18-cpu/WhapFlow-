import { Merchant } from "../src/supabase/functions/server/types.ts";

// Verify that the Merchant interface has all required fields
const mockMerchant: Merchant = {
  shop: "test-shop.myshopify.com",
  access_token: "shpat_1234567890abcdef",
  scopes: "read_products,read_orders",
  plan: "starter",
  shopify_connected: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Verify that optional fields are handled correctly (none in this interface currently)
// But access_token can be null
const disconnectedMerchant: Merchant = {
  shop: "disconnected.myshopify.com",
  access_token: null,
  scopes: "",
  plan: "free",
  shopify_connected: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

console.log("✅ Merchant interface verification passed.");
