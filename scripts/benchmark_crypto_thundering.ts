import { encrypt } from "../src/supabase/functions/server/crypto.ts";

// Mock environment for getEnv
(globalThis as any).process = {
  env: {
    ENCRYPTION_SECRET: "test-secret-at-least-32-chars-long-123456"
  }
};

async function benchmark() {
  const text = "Sensitive data";
  const CONCURRENCY = 50;

  console.log(`Simulating thundering herd with ${CONCURRENCY} concurrent cold-start requests...`);

  // We can't easily clear the module-level cache without re-importing or having a reset hook.
  // But on the first run of the script, it IS cold.

  const start = performance.now();
  const results = await Promise.all(Array.from({ length: CONCURRENCY }, () => encrypt(text)));
  const end = performance.now();

  const totalTime = end - start;
  console.log(`Total time for ${CONCURRENCY} concurrent calls: ${totalTime.toFixed(2)}ms`);
  console.log(`Average time per call: ${(totalTime / CONCURRENCY).toFixed(2)}ms`);

  // Verify results are actually encrypted
  if (results.every(r => r?.startsWith("enc:v3:"))) {
    console.log("✅ All results valid.");
  } else {
    console.error("❌ Some results failed.");
  }
}

benchmark().catch(console.error);
