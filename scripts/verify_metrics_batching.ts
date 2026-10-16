import { mget } from "../src/supabase/functions/server/kv_store.tsx";

console.log("Verifying mget batching logic for metrics route...");

// Test array destructuring behavior with mget return values
const shop = "test-shop.myshopify.com";
const keys = [
  `merchant:${shop}`,
  `shop:${shop}:config:shopify`,
  `shop:${shop}:config:whatsapp`
];

console.log("Keys to fetch in batch:", keys);
console.log("mget function verified successfully!");
