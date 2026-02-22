
// Optimized logic re-implemented for verification in Node.js environment
// to avoid jsr: protocol issues in kv_store.tsx

interface BillingConfig {
  plan: string;
  ai_generations_used: number;
  whatsapp_conversations_used: number;
  billing_cycle_reset_at: string;
}

const BILLING_KEY_PREFIX = "billing:config:";

async function getBillingConfig(shop: string = "global", preFetchedConfig?: BillingConfig | null, kvGet?: (k: string) => Promise<any>): Promise<BillingConfig> {
  const key = `${BILLING_KEY_PREFIX}${shop}`;

  // LOGIC UNDER TEST:
  let config = preFetchedConfig !== undefined ? preFetchedConfig : (kvGet ? await kvGet(key) : null);

  // Initialize if missing
  if (!config) {
    config = {
      plan: 'free',
      ai_generations_used: 0,
      whatsapp_conversations_used: 0,
      billing_cycle_reset_at: new Date(Date.now() + 86400000).toISOString()
    };
  }

  return config;
}

async function incrementUsage(metric: 'ai' | 'whatsapp', shop: string = "global", preFetchedConfig?: BillingConfig | null, kvGet?: (k: string) => Promise<any>, kvSet?: (k: string, v: any) => Promise<void>): Promise<BillingConfig> {
  // LOGIC UNDER TEST:
  const config = await getBillingConfig(shop, preFetchedConfig, kvGet);

  if (metric === 'ai') {
    config.ai_generations_used += 1;
  }

  if (kvSet) {
    await kvSet(`${BILLING_KEY_PREFIX}${shop}`, config);
  }
  return config;
}

async function testBillingOptimization() {
  console.log("Testing Billing Optimization Logic...");
  const shop = "test-shop.myshopify.com";

  const mockConfig: BillingConfig = {
    plan: 'starter',
    ai_generations_used: 10,
    whatsapp_conversations_used: 50,
    billing_cycle_reset_at: new Date(Date.now() + 86400000).toISOString()
  };

  let kvGetCalls = 0;
  const mockKvGet = async (key: string) => {
    kvGetCalls++;
    return { ...mockConfig };
  };

  let kvSetCalls = 0;
  const mockKvSet = async (key: string, value: any) => {
    kvSetCalls++;
  };

  // 1. Test incrementUsage WITH pre-fetched data
  console.log("  - Testing incrementUsage WITH pre-fetched data...");
  const updated1 = await incrementUsage('ai', shop, { ...mockConfig }, mockKvGet, mockKvSet);

  if (updated1.ai_generations_used !== 11) throw new Error("Usage not incremented correctly in Test 1");
  if (kvGetCalls !== 0) throw new Error(`kv.get called ${kvGetCalls} times (expected 0)`);
  if (kvSetCalls !== 1) throw new Error(`kv.set called ${kvSetCalls} times (expected 1)`);
  console.log("    ✅ Success: kv.get avoided");

  // Reset counters
  kvGetCalls = 0;
  kvSetCalls = 0;

  // 2. Test incrementUsage WITHOUT pre-fetched data (fallback)
  console.log("  - Testing incrementUsage WITHOUT pre-fetched data...");
  const updated2 = await incrementUsage('ai', shop, undefined, mockKvGet, mockKvSet);

  if (updated2.ai_generations_used !== 11) throw new Error("Usage not incremented correctly in Test 2");
  if (kvGetCalls !== 1) throw new Error(`kv.get called ${kvGetCalls} times (expected 1)`);
  if (kvSetCalls !== 1) throw new Error(`kv.set called ${kvSetCalls} times (expected 1)`);
  console.log("    ✅ Success: fallback worked");
}

testBillingOptimization().then(() => {
  console.log("\n✨ Logic verification successful!");
}).catch(err => {
  console.error("\n❌ Verification failed:", err);
  process.exit(1);
});
