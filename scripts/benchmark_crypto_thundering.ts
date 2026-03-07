
import { encrypt } from "../src/supabase/functions/server/crypto.ts";

// Mock Deno global for Node.js environment
// @ts-ignore
global.Deno = {
  env: {
    get: (key: string) => {
      if (key === "ENCRYPTION_SECRET") return "test-secret-12345678901234567890123456789012";
      return undefined;
    }
  }
};

async function benchmark() {
  console.log("Benchmarking concurrent encryption (thundering herd check)...");

  // Cold start - clear cache if it was somehow set (though in this script it starts fresh)

  const start = performance.now();
  await Promise.all([
    encrypt("test-data-1"),
    encrypt("test-data-2"),
    encrypt("test-data-3"),
    encrypt("test-data-4"),
    encrypt("test-data-5")
  ]);
  const end = performance.now();
  console.log(`Time for 5 concurrent encryptions (cold cache): ${(end - start).toFixed(2)}ms`);

  const start2 = performance.now();
  await Promise.all([
    encrypt("test-data-1"),
    encrypt("test-data-2"),
    encrypt("test-data-3"),
    encrypt("test-data-4"),
    encrypt("test-data-5")
  ]);
  const end2 = performance.now();
  console.log(`Time for 5 concurrent encryptions (hot cache): ${(end2 - start2).toFixed(2)}ms`);
}

benchmark().catch(console.error);
