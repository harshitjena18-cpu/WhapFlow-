import { encrypt, decrypt } from "../src/supabase/functions/server/crypto.ts";
import { Buffer } from "node:buffer";

// Mock environment for getEnv
(globalThis as any).process = {
  env: {
    ENCRYPTION_SECRET: "test-secret-at-least-32-chars-long-123456"
  }
};

async function benchmark() {
  const text = "Sensitive customer data that needs encryption";
  const iterations = 1000;

  console.log(`Running crypto benchmark (${iterations} iterations)...`);

  // Warm up
  await encrypt(text);

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const enc = await encrypt(text);
    await decrypt(enc);
  }
  const end = performance.now();

  console.log(`Total time: ${(end - start).toFixed(2)}ms`);
  console.log(`Average time per encrypt/decrypt cycle: ${((end - start) / iterations).toFixed(4)}ms`);

  // Thundering herd test
  console.log("\nTesting thundering herd (50 concurrent calls)...");
  // Reset cache if possible? (Hard without modifying the source)
  // For now, let's just measure concurrent calls
  const startConc = performance.now();
  await Promise.all(Array.from({ length: 50 }, () => encrypt(text)));
  const endConc = performance.now();
  console.log(`Time for 50 concurrent encryptions: ${(endConc - startConc).toFixed(2)}ms`);
}

benchmark().catch(console.error);
