
import { Buffer } from "node:buffer";

const hmac = "2eb6f5e718b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5"; // 64 chars hex (SHA256)
const iterations = 100000;

function manualLoop() {
  const hmacBytes = new Uint8Array(hmac.length / 2);
  for (let i = 0; i < hmac.length; i += 2) {
    hmacBytes[i / 2] = parseInt(hmac.substring(i, i + 2), 16);
  }
  return hmacBytes;
}

function bufferFrom() {
  return Buffer.from(hmac, 'hex');
}

console.log("Starting benchmark...");

const start1 = performance.now();
for (let i = 0; i < iterations; i++) {
  manualLoop();
}
const end1 = performance.now();
console.log(`Manual loop: ${end1 - start1}ms`);

const start2 = performance.now();
for (let i = 0; i < iterations; i++) {
  bufferFrom();
}
const end2 = performance.now();
console.log(`Buffer.from: ${end2 - start2}ms`);

console.log(`Improvement: ${((end1 - start1) / (end2 - start2)).toFixed(2)}x faster`);
