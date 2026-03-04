import { encrypt } from "../src/supabase/functions/server/crypto.ts";

// Mock Deno global for Node.js environment
// @ts-ignore: Mocking Deno
global.Deno = {
  env: {
    get: (key: string) => "test-secret-key-for-benchmark"
  }
};

async function benchmark() {
  console.log("Benchmarking Crypto (Concurrent)...");

  const iterations = 50;

  // Warm up
  await encrypt("warmup");

  const start = performance.now();

  // Trigger many concurrent encryption calls
  const promises = [];
  for (let i = 0; i < iterations; i++) {
    promises.push(encrypt("sensitive-data-" + i));
  }

  await Promise.all(promises);
  const end = performance.now();

  console.log(`Time for ${iterations} concurrent encryptions: ${(end - start).toFixed(2)}ms`);
  console.log(`Average time: ${((end - start) / iterations).toFixed(2)}ms`);
}

benchmark().catch(console.error);
