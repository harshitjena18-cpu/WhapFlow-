
import { Buffer } from "node:buffer";

function parseIntWay(hmac: string) {
  const hmacBytes = new Uint8Array(hmac.length / 2);
  for (let i = 0; i < hmac.length; i += 2) {
    hmacBytes[i / 2] = parseInt(hmac.substring(i, i + 2), 16);
  }
  return hmacBytes;
}

function bufferWay(hmac: string) {
  return Buffer.from(hmac, 'hex');
}

const testHmac = "2fb947119056d649f8745582f34255767b0b2e8a7197b134d1b8219430c5e7c8";

function runBenchmark(name: string, fn: (s: string) => any, iterations: number) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn(testHmac);
  }
  const end = performance.now();
  return end - start;
}

const iterations = 100000;
console.log(`Running benchmark with ${iterations} iterations...`);

const time1 = runBenchmark("parseInt", parseIntWay, iterations);
console.log(`parseInt loop: ${time1.toFixed(2)}ms`);

const time2 = runBenchmark("Buffer.from", bufferWay, iterations);
console.log(`Buffer.from: ${time2.toFixed(2)}ms`);

console.log(`Improvement: ${(time1 / time2).toFixed(2)}x faster`);
