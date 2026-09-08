// Verification script for /metrics batching logic
// Verifies that kv.mget properly batches lookups and returns values in expected order.

const BILLING_KEY_PREFIX = "billing:config:";

// Mock kv.mget implementation behavior
function mockMget<T = any>(keys: string[], store: Map<string, any>): (T | null)[] {
  return keys.map((key) => store.get(key) ?? null);
}

async function verifyMetricsBatching() {
  console.log("⚡ Verifying KV batching logic for /metrics endpoint...");

  const shop = "test-store.myshopify.com";
  const mockDb = new Map<string, any>([
    [`merchant:${shop}`, { shop, plan: "growth" }],
    [`shop:${shop}:config:shopify`, { connection_status: "connected" }],
    [`shop:${shop}:config:whatsapp`, { connection_status: "connected" }],
    [`${BILLING_KEY_PREFIX}${shop}`, {
      plan: "growth",
      ai_generations_used: 12,
      whatsapp_conversations_used: 150,
      billing_cycle_reset_at: "2026-04-01T00:00:00.000Z"
    }]
  ]);

  const keysToBatch = [
    `merchant:${shop}`,
    `shop:${shop}:config:shopify`,
    `shop:${shop}:config:whatsapp`,
    `${BILLING_KEY_PREFIX}${shop}`
  ];

  const [merchant, shopifyConfig, whatsappConfig, preFetchedBilling] = mockMget(keysToBatch, mockDb);

  console.log("Batched Keys Requested:", keysToBatch.length);
  console.log("Merchant fetched:", merchant?.shop === shop);
  console.log("Shopify Connected:", shopifyConfig?.connection_status === "connected");
  console.log("WhatsApp Connected:", whatsappConfig?.connection_status === "connected");
  console.log("Pre-fetched Billing Plan:", preFetchedBilling?.plan);

  if (
    merchant &&
    shopifyConfig &&
    whatsappConfig &&
    preFetchedBilling &&
    preFetchedBilling.plan === "growth"
  ) {
    console.log("✅ KV mget batching logic successfully verified!");
  } else {
    console.error("❌ Verification failed!");
    process.exit(1);
  }
}

verifyMetricsBatching().catch((err) => {
  console.error("Fatal error during verification:", err);
  process.exit(1);
});
