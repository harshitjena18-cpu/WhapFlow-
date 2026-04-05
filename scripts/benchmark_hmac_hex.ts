// scripts/benchmark_hmac_hex.ts
import { Buffer } from "node:buffer";

const hmac = "2973169733475971a812e95a943793f06e00c36a449a0d844bc19f918804f85e";

function manual() {
  const hmacBytes = new Uint8Array(hmac.length / 2);
  for (let i = 0; i < hmac.length; i += 2) {
    hmacBytes[i / 2] = parseInt(hmac.substring(i, i + 2), 16);
  }
  return hmacBytes;
}

function optimized() {
  return Buffer.from(hmac, "hex");
}

const iterations = 1000000;

// Warmup
for (let i = 0; i < 10000; i++) {
    manual();
    optimized();
}

console.log(`Running ${iterations} iterations...`);

console.time("Manual");
for (let i = 0; i < iterations; i++) manual();
console.timeEnd("Manual");

console.time("Optimized");
for (let i = 0; i < iterations; i++) optimized();
console.timeEnd("Optimized");
