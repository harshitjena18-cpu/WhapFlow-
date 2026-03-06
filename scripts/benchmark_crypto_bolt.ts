
import { encrypt } from "../src/supabase/functions/server/crypto.ts";

// Mock Deno global for Node.js environment
// @ts-ignore: Mocking Deno
global.Deno = {
  env: {
    get: (key: string) => process.env[key]
  }
};

// Set test secret
process.env.ENCRYPTION_SECRET = "test-encryption-secret-key-12345";

async function runBenchmark() {
  console.log("--- Crypto Performance Benchmark ---");
  const iterations = 50;
  const sampleText = "shpat_1234567890abcdef";

  console.log(`Running ${iterations} concurrent encryption calls...`);

  const start = performance.now();
  await Promise.all(Array.from({ length: iterations }, () => encrypt(sampleText)));
  const end = performance.now();

  const totalTime = end - start;
  const avgTime = totalTime / iterations;

  console.log(`Total time for ${iterations} concurrent calls: ${totalTime.toFixed(2)}ms`);
  console.log(`Average time per call: ${avgTime.toFixed(2)}ms`);
  console.log("-------------------------------------");
}

runBenchmark().catch(err => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
