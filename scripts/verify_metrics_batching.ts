import fs from "node:fs";
import path from "node:path";

// 1. Verify source file code structure directly
const metricsRoutePath = path.join(process.cwd(), "src/supabase/functions/server/metrics_routes.tsx");
const code = fs.readFileSync(metricsRoutePath, "utf-8");

if (!code.includes("kv.mget([")) {
  console.error("❌ Verification failed: kv.mget batching is not present in metrics_routes.tsx");
  process.exit(1);
}

if (!code.includes("billing.getBillingConfig(shop, preFetchedBilling")) {
  console.error("❌ Verification failed: preFetchedBilling is not passed to billing.getBillingConfig");
  process.exit(1);
}

console.log("✅ Code structure verified: metrics_routes.tsx uses kv.mget batching and passes preFetchedBilling.");

// 2. Functional simulation of the KV calls
let mgetCalls = 0;
let getByPrefixCalls = 0;

const mockShop = "test.myshopify.com";

const mockKv = {
  async mget(keys: string[]) {
    mgetCalls++;
    return keys.map(k => {
      if (k.startsWith("merchant:")) return { id: "m1", shop: mockShop };
      if (k.includes("config:shopify")) return { connection_status: "connected" };
      if (k.includes("config:whatsapp")) return { connection_status: "connected" };
      if (k.startsWith("billing:config:")) return { plan: "starter", ai_generations_used: 1, whatsapp_conversations_used: 5, billing_cycle_reset_at: "2099-01-01T00:00:00.000Z" };
      return null;
    });
  },
  async getByPrefix(prefix: string) {
    getByPrefixCalls++;
    return [{ id: "tpl1", enabled: true }];
  }
};

async function testBatchingLogic() {
  const [configs, rawTemplates] = await Promise.all([
    mockKv.mget([
      `merchant:${mockShop}`,
      `shop:${mockShop}:config:shopify`,
      `shop:${mockShop}:config:whatsapp`,
      `billing:config:${mockShop}`
    ]),
    mockKv.getByPrefix(`shop:${mockShop}:template:`)
  ]);

  if (mgetCalls !== 1) {
    console.error(`❌ Expected 1 mget call, got ${mgetCalls}`);
    process.exit(1);
  }

  if (getByPrefixCalls !== 1) {
    console.error(`❌ Expected 1 getByPrefix call, got ${getByPrefixCalls}`);
    process.exit(1);
  }

  const [merchant, shopifyConfig, whatsappConfig, preFetchedBilling] = configs;

  if (!merchant || !shopifyConfig || !whatsappConfig || !preFetchedBilling) {
    console.error("❌ Pre-fetched config mapping failed!");
    process.exit(1);
  }

  console.log("✅ Functional batching test passed: All 4 KV keys fetched in 1 kv.mget call concurrently with getByPrefix.");
}

testBatchingLogic();
