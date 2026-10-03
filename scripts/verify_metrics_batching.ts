// scripts/verify_metrics_batching.ts

/**
 * Verification and benchmark script for:
 * 1. KV batching with kv.mget & pre-fetched billing config reuse in metrics route
 * 2. ISO timestamp string comparison vs Date parsing in templates sorting
 */

import { performance } from "perf_hooks";

// --- 1. Test ISO Timestamp Sorting Optimization ---
console.log("=== 1. Testing ISO Timestamp Sorting Optimization ===");

interface TestItem {
  id: string;
  created_at: string;
}

// Generate sample ISO dates
const itemsCount = 1000;
const testItems: TestItem[] = [];
const baseTime = new Date("2025-01-01T00:00:00.000Z").getTime();

for (let i = 0; i < itemsCount; i++) {
  const randomOffset = Math.floor(Math.random() * 1000000000);
  testItems.push({
    id: `item-${i}`,
    created_at: new Date(baseTime + randomOffset).toISOString(),
  });
}

// Method A: Date parsing
const listA = [...testItems];
const startA = performance.now();
listA.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
const timeA = performance.now() - startA;

// Method B: Direct ISO string comparison
const listB = [...testItems];
const startB = performance.now();
listB.sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));
const timeB = performance.now() - startB;

// Verify accuracy
let isIdentical = true;
for (let i = 0; i < itemsCount; i++) {
  if (listA[i].id !== listB[i].id) {
    isIdentical = false;
    break;
  }
}

console.log(`Accuracy Check: ${isIdentical ? "✅ IDENTICAL SORT ORDER" : "❌ MISMATCH DETECTED"}`);
console.log(`Date Parsing Sort Time:      ${timeA.toFixed(3)}ms`);
console.log(`ISO String Compare Sort Time: ${timeB.toFixed(3)}ms`);
console.log(`Speedup Factor:               ${(timeA / timeB).toFixed(2)}x faster`);

if (!isIdentical) {
  console.error("Sorting output verification failed!");
  process.exit(1);
}

// --- 2. Test KV Batching & Billing Config Pre-fetching Logic ---
console.log("\n=== 2. Testing KV Batching & Pre-fetched Config Logic ===");

let kvGetCalls = 0;
let kvMgetCalls = 0;

const BILLING_KEY_PREFIX = "billing:config:";

const mockKVStore: Record<string, any> = {
  "merchant:test-shop.myshopify.com": { shopify_connected: true },
  "shop:test-shop.myshopify.com:config:shopify": { connection_status: "connected" },
  "shop:test-shop.myshopify.com:config:whatsapp": { connection_status: "connected" },
  "billing:config:test-shop.myshopify.com": {
    plan: "growth",
    ai_generations_used: 2,
    whatsapp_conversations_used: 10,
    billing_cycle_reset_at: "2026-01-01T00:00:00.000Z",
  },
};

// Mock KV functions
async function mockGet(key: string) {
  kvGetCalls++;
  await new Promise((resolve) => setTimeout(resolve, 10)); // Simulated DB roundtrip
  return mockKVStore[key] || null;
}

async function mockMget(keys: string[]) {
  kvMgetCalls++;
  await new Promise((resolve) => setTimeout(resolve, 10)); // Simulated DB roundtrip
  return keys.map((k) => mockKVStore[k] || null);
}

// Emulates getBillingConfig(shop, preFetchedConfig) from src/supabase/functions/server/billing.ts
async function getBillingConfig(shop: string = "global", preFetchedConfig?: any) {
  const key = `${BILLING_KEY_PREFIX}${shop}`;
  let config = preFetchedConfig !== undefined ? preFetchedConfig : (await mockGet(key));
  if (!config) {
    config = { plan: 'free', ai_generations_used: 0, whatsapp_conversations_used: 0, billing_cycle_reset_at: '2026-01-01' };
  }
  return config;
}

// Scenario 1: Unoptimized - Multiple kv.get calls
async function runUnoptimized(shop: string) {
  kvGetCalls = 0;
  kvMgetCalls = 0;
  const start = performance.now();

  const [merchant, shopifyConfig, whatsappConfig, billingConfig] = await Promise.all([
    mockGet(`merchant:${shop}`),
    mockGet(`shop:${shop}:config:shopify`),
    mockGet(`shop:${shop}:config:whatsapp`),
    getBillingConfig(shop), // Calls mockGet internally!
  ]);

  const duration = performance.now() - start;
  return { duration, getCalls: kvGetCalls, mgetCalls: kvMgetCalls, billingConfig };
}

// Scenario 2: Optimized - Single kv.mget call
async function runOptimized(shop: string) {
  kvGetCalls = 0;
  kvMgetCalls = 0;
  const start = performance.now();

  const kvBatch = await mockMget([
    `merchant:${shop}`,
    `shop:${shop}:config:shopify`,
    `shop:${shop}:config:whatsapp`,
    `${BILLING_KEY_PREFIX}${shop}`,
  ]);

  const [merchant, shopifyConfig, whatsappConfig, preFetchedBilling] = kvBatch;
  const billingConfig = await getBillingConfig(shop, preFetchedBilling);

  const duration = performance.now() - start;
  return { duration, getCalls: kvGetCalls, mgetCalls: kvMgetCalls, billingConfig };
}

async function verifyBatching() {
  const shop = "test-shop.myshopify.com";

  const unopt = await runUnoptimized(shop);
  const opt = await runOptimized(shop);

  console.log("Unoptimized (Separate kv.get calls):");
  console.log(`  Duration:   ${unopt.duration.toFixed(2)}ms`);
  console.log(`  kv.get:     ${unopt.getCalls}`);
  console.log(`  kv.mget:    ${unopt.mgetCalls}`);

  console.log("\nOptimized (Batched kv.mget + pre-fetched config):");
  console.log(`  Duration:   ${opt.duration.toFixed(2)}ms`);
  console.log(`  kv.get:     ${opt.getCalls}`);
  console.log(`  kv.mget:    ${opt.mgetCalls}`);

  if (opt.getCalls === 0 && opt.mgetCalls === 1 && JSON.stringify(unopt.billingConfig) === JSON.stringify(opt.billingConfig)) {
    console.log("\n✅ Batching verification PASSED: 0 kv.get calls, 1 kv.mget call, identical output!");
  } else {
    console.error("\n❌ Batching verification FAILED!");
    process.exit(1);
  }
}

verifyBatching().catch((err) => {
  console.error("Verification script error:", err);
  process.exit(1);
});
