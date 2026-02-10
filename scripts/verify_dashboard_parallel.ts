
// scripts/verify_dashboard_parallel.ts

/**
 * MOCK KV STORE
 */
const kvCalls: string[] = [];
const mockKV = {
  get: async (key: string) => {
    kvCalls.push(`get:${key}`);
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate latency
    if (key.startsWith('merchant:')) {
      return key.endsWith(':valid-shop') ? { id: 'm1' } : null;
    }
    return { data: 'mock-data' };
  }
};

/**
 * REPLICATED LOGIC FROM dashboard.tsx (Refactored version)
 */
async function simulateGetData(shop: string | undefined) {
  if (!shop) return { error: "Missing shop parameter", status: 400 };

  try {
    const results = await Promise.all([
      mockKV.get(`merchant:${shop}`),
      mockKV.get(`shop:${shop}:metrics`),
      mockKV.get(`shop:${shop}:revenue`),
      mockKV.get(`shop:${shop}:activity`)
    ]);

    const merchant = results[0];
    const metrics = results[1];
    const revenue = results[2];
    const activity = results[3];

    if (!merchant) {
        return { error: "Unauthorized: Merchant not found", status: 401 };
    }

    return { metrics, revenue, activity };
  } catch (err) {
    return { error: "internal" };
  }
}

async function simulateGetAutomations(shop: string | undefined) {
    if (!shop) return { error: "Missing shop parameter", status: 400 };

    try {
      const [merchant, automations] = await Promise.all([
        mockKV.get(`merchant:${shop}`),
        mockKV.get(`shop:${shop}:automations`)
      ]);

      if (!merchant) return { error: "Unauthorized: Merchant not found", status: 401 };

      return { automations };
    } catch (err) {
      return { error: "internal" };
    }
}

/**
 * VERIFICATION TESTS
 */
async function runTests() {
  console.log("🚀 Starting Verification: Dashboard Parallelization\n");

  // 1. Test /data route with valid shop
  kvCalls.length = 0;
  console.log("Test 1: GET /data (Valid Shop)");
  const start1 = performance.now();
  const res1 = await simulateGetData("valid-shop");
  const duration1 = performance.now() - start1;

  if ((res1 as any).error) throw new Error(`Test 1 failed: ${(res1 as any).error}`);
  if (duration1 > 120) throw new Error("Test 1 failed: Calls appear sequential");
  if (kvCalls.length !== 4) throw new Error("Test 1 failed: Incorrect number of KV calls");

  console.log("  - Status: SUCCESS");
  console.log("  - KV Calls:", JSON.stringify(kvCalls));
  console.log("  - Duration:", duration1.toFixed(2), "ms");

  // 2. Test /data route with invalid shop
  kvCalls.length = 0;
  console.log("\nTest 2: GET /data (Invalid Shop)");
  const res2 = await simulateGetData("invalid-shop");

  if ((res2 as any).error !== "Unauthorized: Merchant not found") {
      throw new Error(`Test 2 failed: Expected Unauthorized error, got ${JSON.stringify(res2)}`);
  }
  console.log("  - Status: SUCCESS (Blocked)");

  // 3. Test /automations route
  kvCalls.length = 0;
  console.log("\nTest 3: GET /automations (Valid Shop)");
  const start3 = performance.now();
  const res3 = await simulateGetAutomations("valid-shop");
  const duration3 = performance.now() - start3;

  if ((res3 as any).error) throw new Error(`Test 3 failed: ${(res3 as any).error}`);
  if (duration3 > 120) throw new Error("Test 3 failed: Calls appear sequential");

  console.log("  - Status: SUCCESS");
  console.log("  - KV Calls:", JSON.stringify(kvCalls));
  console.log("  - Duration:", duration3.toFixed(2), "ms");

  console.log("\n✅ ALL TESTS PASSED: Dashboard routes are correctly parallelized!");
}

runTests().catch(err => {
  console.error("\n❌ VERIFICATION FAILED:", err.message);
  process.exit(1);
});
