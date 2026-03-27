
import { Buffer } from "node:buffer";

const hmac = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"; // 64 chars = 32 bytes

function manualLoop(hmac: string): Uint8Array {
  const hmacBytes = new Uint8Array(hmac.length / 2);
  for (let i = 0; i < hmac.length; i += 2) {
    hmacBytes[i / 2] = parseInt(hmac.substring(i, i + 2), 16);
  }
  return hmacBytes;
}

function bufferFrom(hmac: string): Uint8Array {
  return Buffer.from(hmac, 'hex');
}

const ITERATIONS = 100000;

console.log(`Starting benchmark for ${ITERATIONS} iterations...`);

const startManual = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  manualLoop(hmac);
}
const endManual = performance.now();
const manualTime = endManual - startManual;

const startBuffer = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  bufferFrom(hmac);
}
const endBuffer = performance.now();
const bufferTime = endBuffer - startBuffer;

console.log(`Manual Loop: ${manualTime.toFixed(2)}ms`);
console.log(`Buffer.from: ${bufferTime.toFixed(2)}ms`);
console.log(`Speedup: ${(manualTime / bufferTime).toFixed(2)}x`);
