import { encrypt, decrypt } from "../src/supabase/functions/server/crypto.ts";

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
  console.log("Running Crypto Thundering Herd (COLD START) Benchmark...");

  const count = 100;
  const text = "sensitive_data_to_encrypt";

  console.log(`Simulating ${count} concurrent COLD START encryption requests...`);
  const start = performance.now();
  await Promise.all(Array.from({ length: count }, () => encrypt(text)));
  const end = performance.now();

  console.log(`Total time for ${count} COLD START requests: ${(end - start).toFixed(2)}ms`);
  console.log(`Average time per request: ${((end - start) / count).toFixed(2)}ms`);
}

runBenchmark().catch(err => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
