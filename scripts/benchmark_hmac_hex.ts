import { Buffer } from "node:buffer";

const hmac = "f0e1d2c3b4a5968778695a4b3c2d1e0f0e1d2c3b4a5968778695a4b3c2d1e0f"; // 64 chars hex

console.log("Running benchmark: manual loop vs Buffer.from (100,000 iterations)");

console.time("manual_loop");
for (let j = 0; j < 100000; j++) {
  const hmacBytes = new Uint8Array(hmac.length / 2);
  for (let i = 0; i < hmac.length; i += 2) {
    hmacBytes[i / 2] = parseInt(hmac.substring(i, i + 2), 16);
  }
}
console.timeEnd("manual_loop");

console.time("buffer_from");
for (let j = 0; j < 100000; j++) {
  const hmacBytes = Buffer.from(hmac, "hex");
}
console.timeEnd("buffer_from");
