/**
 * scripts/benchmark_metrics_opt.ts
 *
 * Benchmarks the Dashboard Metrics I/O consolidation optimization.
 * Measures the difference in database/KV round-trip latency and connection overhead.
 */

const DB_ROUNDTRIP_LATENCY = 50; // Realistic simulated DB round-trip latency in ms

async function mockSingleGet(key: string): Promise<any> {
  await new Promise((resolve) => setTimeout(resolve, DB_ROUNDTRIP_LATENCY));
  return { key, value: `data-for-${key}` };
}

async function mockBatchMget(keys: string[]): Promise<any[]> {
  await new Promise((resolve) => setTimeout(resolve, DB_ROUNDTRIP_LATENCY));
  return keys.map((key) => ({ key, value: `data-for-${key}` }));
}

async function runBaseline(iterations: number): Promise<{ duration: number; dbConnections: number }> {
  const start = performance.now();
  let dbConnections = 0;

  for (let i = 0; i < iterations; i++) {
    // In baseline parallel Promise.all, we perform 4 individual concurrent kv.get calls.
    // Each call counts as an active DB connection/query.
    dbConnections += 4;
    await Promise.all([
      mockSingleGet("merchant"),
      mockSingleGet("shopifyConfig"),
      mockSingleGet("whatsappConfig"),
      mockSingleGet("billingConfig")
    ]);
  }

  return {
    duration: performance.now() - start,
    dbConnections
  };
}

async function runOptimized(iterations: number): Promise<{ duration: number; dbConnections: number }> {
  const start = performance.now();
  let dbConnections = 0;

  for (let i = 0; i < iterations; i++) {
    // In optimized batching, we perform a single kv.mget call.
    // This utilizes only 1 DB connection/query.
    dbConnections += 1;
    await mockBatchMget(["merchant", "shopifyConfig", "whatsappConfig", "billingConfig"]);
  }

  return {
    duration: performance.now() - start,
    dbConnections
  };
}

async function main() {
  const ITERATIONS = 50;

  console.log("⚡ Benchmarking Dashboard Metrics I/O Optimization...");
  console.log(`Config: ${ITERATIONS} iterations, simulated DB latency of ${DB_ROUNDTRIP_LATENCY}ms per round-trip.\n`);

  console.log("Running Baseline (4 parallel kv.get calls per iteration)...");
  const baseline = await runBaseline(ITERATIONS);

  console.log("Running Optimized (1 consolidated kv.mget call per iteration)...");
  const optimized = await runOptimized(ITERATIONS);

  const avgBaselineTime = baseline.duration / ITERATIONS;
  const avgOptimizedTime = optimized.duration / ITERATIONS;

  console.log("\n--- Latency Results ---");
  console.log(`Baseline Average Latency:  ${avgBaselineTime.toFixed(2)}ms`);
  console.log(`Optimized Average Latency: ${avgOptimizedTime.toFixed(2)}ms`);
  console.log(`Estimated Speedup:         ${(avgBaselineTime / avgOptimizedTime).toFixed(2)}x`);
  console.log(`Latency Savings per request: ${(avgBaselineTime - avgOptimizedTime).toFixed(2)}ms`);

  console.log("\n--- Database Connection Overhead ---");
  console.log(`Baseline DB Queries/Connections:  ${baseline.dbConnections}`);
  console.log(`Optimized DB Queries/Connections: ${optimized.dbConnections}`);
  console.log(`Database Load Reduction:          ${(((baseline.dbConnections - optimized.dbConnections) / baseline.dbConnections) * 100).toFixed(1)}%`);

  console.log("\n✅ Done.");
}

main().catch(console.error);
