import { Buffer } from "node:buffer";

const hmac = "2d6c1c8a1e2f3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e";

function manualLoop(hmac: string) {
  const hmacBytes = new Uint8Array(hmac.length / 2);
  for (let i = 0; i < hmac.length; i += 2) {
    hmacBytes[i / 2] = parseInt(hmac.substring(i, i + 2), 16);
  }
  return hmacBytes;
}

function bufferHex(hmac: string) {
  return Buffer.from(hmac, 'hex');
}

// Warm up
for(let i=0; i<1000; i++) {
    manualLoop(hmac);
    bufferHex(hmac);
}

const iterations = 1000000;

console.log("Starting benchmark with " + iterations + " iterations...");

const startManual = performance.now();
for(let i=0; i<iterations; i++) {
    manualLoop(hmac);
}
const endManual = performance.now();
console.log("manualLoop: " + (endManual - startManual).toFixed(2) + "ms");

const startBuffer = performance.now();
for(let i=0; i<iterations; i++) {
    bufferHex(hmac);
}
const endBuffer = performance.now();
console.log("bufferHex: " + (endBuffer - startBuffer).toFixed(2) + "ms");
