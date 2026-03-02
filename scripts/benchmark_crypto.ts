import { encrypt, decrypt } from "../src/supabase/functions/server/crypto.ts";

// Mock env
process.env.ENCRYPTION_SECRET = "test-secret-at-least-32-chars-long-12345";

async function benchmark() {
  const text = "Hello, Bolt! This is a test message to benchmark encryption.";
  const iterations = 1000;

  console.log(`Starting benchmark with ${iterations} iterations...`);

  // Warmup
  await encrypt(text);

  // Sequential Encryption
  let start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await encrypt(text);
  }
  let end = performance.now();
  console.log(`Sequential Encryption: ${(end - start).toFixed(2)}ms (avg: ${((end - start) / iterations).toFixed(4)}ms/op)`);

  const encrypted = await encrypt(text);

  // Sequential Decryption
  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await decrypt(encrypted);
  }
  end = performance.now();
  console.log(`Sequential Decryption: ${(end - start).toFixed(2)}ms (avg: ${((end - start) / iterations).toFixed(4)}ms/op)`);

  // Concurrent Encryption
  start = performance.now();
  await Promise.all(Array.from({ length: iterations }, () => encrypt(text)));
  end = performance.now();
  console.log(`Concurrent Encryption: ${(end - start).toFixed(2)}ms (avg: ${((end - start) / iterations).toFixed(4)}ms/op)`);

  // Concurrent Decryption
  start = performance.now();
  await Promise.all(Array.from({ length: iterations }, () => decrypt(encrypted)));
  end = performance.now();
  console.log(`Concurrent Decryption: ${(end - start).toFixed(2)}ms (avg: ${((end - start) / iterations).toFixed(4)}ms/op)`);
}

benchmark().catch(console.error);
