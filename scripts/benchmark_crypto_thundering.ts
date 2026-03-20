
import { encrypt } from "../src/supabase/functions/server/crypto.ts";

// Mock environment
// @ts-ignore
globalThis.Deno = {
  env: {
    get: (key: string) => process.env[key]
  }
};

process.env.ENCRYPTION_SECRET = "test-secret-for-benchmarking-123456789";

async function runBenchmark() {
  const CONCURRENCY = 100;
  console.log(`🚀 Starting Crypto Benchmark with ${CONCURRENCY} concurrent requests...`);

  const start = performance.now();

  // Simulate thundering herd: 100 concurrent requests while cache is cold
  const promises = Array.from({ length: CONCURRENCY }, () => encrypt("sensitive-data-to-encrypt"));

  await Promise.all(promises);

  const end = performance.now();
  const totalTime = end - start;
  const avgTime = totalTime / CONCURRENCY;

  console.log(`\n📊 Results:`);
  console.log(`- Total time for ${CONCURRENCY} requests: ${totalTime.toFixed(2)}ms`);
  console.log(`- Average time per request: ${avgTime.toFixed(2)}ms`);

  if (totalTime > 50) {
    console.log(`\n⚠️ High latency detected (${totalTime.toFixed(2)}ms). This indicates a thundering herd effect.`);
  } else {
    console.log(`\n✅ Low latency detected. The cache might already be optimized or the environment is extremely fast.`);
  }
}

runBenchmark().catch(console.error);
