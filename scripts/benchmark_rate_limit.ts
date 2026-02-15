// scripts/benchmark_rate_limit.ts

const MOCK_DB_LATENCY_MS = 10;
const shop = "benchmark-shop.myshopify.com";
const ip = "127.0.0.1";

// Mocks the database
const mockKvStore = {
  store: new Map<string, number>(),
  async get(key: string): Promise<number | undefined> {
    await new Promise(resolve => setTimeout(resolve, MOCK_DB_LATENCY_MS));
    return this.store.get(key);
  },
  async set(key: string, value: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, MOCK_DB_LATENCY_MS));
    this.store.set(key, value);
  },
  async del(key: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, MOCK_DB_LATENCY_MS));
    return this.store.delete(key);
  }
};

async function runBenchmark() {
  const iterations = 100;

  console.log(`Running Rate Limit Benchmark with ${iterations} iterations...`);
  console.log(`Simulated DB Latency: ${MOCK_DB_LATENCY_MS}ms`);

  // --- Baseline: Single Key (No Expiry) ---
  console.log("\n--- Baseline: Single Key (No Cleanup) ---");
  const startBaseline = performance.now();
  for (let i = 0; i < iterations; i++) {
    const rateKey = `rate_limit:ai_gen:${shop}:${ip}`;
    const hits = (await mockKvStore.get(rateKey) || 0);
    if (hits > 10) {
      // Limit exceeded
    } else {
      await mockKvStore.set(rateKey, hits + 1);
    }
  }
  const endBaseline = performance.now();
  const durationBaseline = endBaseline - startBaseline;
  console.log(`Duration: ${durationBaseline.toFixed(2)}ms`);

  // --- Optimized: Hourly Key + Cleanup ---
  console.log("\n--- Optimized: Hourly Key + Periodic Cleanup ---");
  const startOptimized = performance.now();
  mockKvStore.store.clear(); // Reset store

  for (let i = 0; i < iterations; i++) {
    // Simulate hour change every 10 iterations to trigger cleanup
    const hourOffset = Math.floor(i / 10);
    const currentHour = new Date(Date.now() + hourOffset * 3600000).toISOString().slice(0, 13);
    const rateKey = `rate_limit:ai_gen:${shop}:${ip}:${currentHour}`;

    const hits = (await mockKvStore.get(rateKey) || 0);

    if (hits > 10) {
        // Limit exceeded
    } else {
        await mockKvStore.set(rateKey, hits + 1);

        // Cleanup logic simulation
        if (hits === 0) {
            // First hit of the hour
            const prevHour = new Date(Date.now() + (hourOffset - 1) * 3600000).toISOString().slice(0, 13);
            const prevKey = `rate_limit:ai_gen:${shop}:${ip}:${prevHour}`;
            // Fire and forget (but await for benchmark accuracy unless we assume async background)
            await mockKvStore.del(prevKey);
        }
    }
  }
  const endOptimized = performance.now();
  const durationOptimized = endOptimized - startOptimized;

  console.log(`Duration: ${durationOptimized.toFixed(2)}ms`);
  console.log(`\nComparison:`);
  console.log(`Baseline Latency/Op: ${(durationBaseline / iterations).toFixed(2)}ms`);
  console.log(`Optimized Latency/Op: ${(durationOptimized / iterations).toFixed(2)}ms`);
  console.log(`Overhead per Op: ${((durationOptimized - durationBaseline) / iterations).toFixed(2)}ms`);

  // Note: The overhead is expected because we do extra work (delete).
  // The goal is not just raw speed, but correctness and storage management.
}

runBenchmark().catch(console.error);
