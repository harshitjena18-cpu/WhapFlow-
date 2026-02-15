
// scripts/benchmark_template_check.ts

// Mock implementation of KV store
const mockTemplates = Array.from({ length: 100 }, (_, i) => ({
  id: `template_${i}`,
  template_name: `My Template ${i}`,
  shop: "test-shop.myshopify.com",
  content: "Hello {{customer_name}}",
  created_at: new Date().toISOString()
}));

const kvMock = {
  // Simulate fetching all templates (slow due to payload size & transfer)
  async getByPrefix(prefix: string) {
    // Simulate network latency (e.g., 50ms)
    await new Promise(resolve => setTimeout(resolve, 50));
    // Simulate serialization/deserialization overhead for 100 items
    return JSON.parse(JSON.stringify(mockTemplates));
  },

  // Simulate fetching by value (fast due to DB filtering & small payload)
  async getByPrefixAndValue(prefix: string, path: string, value: any, limit?: number) {
    // Simulate network latency (e.g., 50ms)
    await new Promise(resolve => setTimeout(resolve, 50));

    // Simulate DB filtering logic
    const found = mockTemplates.filter(t => t.template_name === value);
    const result = limit ? found.slice(0, limit) : found;

    // Simulate serialization/deserialization overhead for 0 or 1 item
    return JSON.parse(JSON.stringify(result));
  }
};

async function benchmark() {
  const shop = "test-shop.myshopify.com";
  const template_name = "My Template 50"; // Exists
  const iterations = 20;

  console.log(`Starting benchmark with ${mockTemplates.length} mock templates...`);
  console.log(`Simulating network latency: 50ms per call`);

  // Baseline: Fetch All
  console.log("\n--- Baseline: Fetch All & Filter in Memory ---");
  const startBaseline = performance.now();
  for (let i = 0; i < iterations; i++) {
    const prefix = `shop:${shop}:template:`;
    const existing = await kvMock.getByPrefix(prefix);
    const exists = existing.some((t: any) => t.template_name === template_name);
  }
  const endBaseline = performance.now();
  const baselineTime = endBaseline - startBaseline;
  console.log(`Total time: ${baselineTime.toFixed(2)}ms`);
  console.log(`Avg time per check: ${(baselineTime / iterations).toFixed(2)}ms`);

  // Optimized: DB Filter
  console.log("\n--- Optimized: DB-side Filtering ---");
  const startOptimized = performance.now();
  for (let i = 0; i < iterations; i++) {
    const prefix = `shop:${shop}:template:`;
    // We expect the implementation to use limit: 1
    const existing = await kvMock.getByPrefixAndValue(prefix, "template_name", template_name, 1);
    const exists = existing.length > 0;
  }
  const endOptimized = performance.now();
  const optimizedTime = endOptimized - startOptimized;
  console.log(`Total time: ${optimizedTime.toFixed(2)}ms`);
  console.log(`Avg time per check: ${(optimizedTime / iterations).toFixed(2)}ms`);

  console.log(`\nImprovement: ${(baselineTime / optimizedTime).toFixed(2)}x faster (simulated)`);
}

benchmark().catch(console.error);
