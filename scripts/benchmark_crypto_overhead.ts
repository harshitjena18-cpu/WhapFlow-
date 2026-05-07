
import { decrypt } from "../src/supabase/functions/server/crypto.ts";

const sampleData = "enc:v3:AAAAAAAAAAAAAAAA:BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

const ITERATIONS = 10000;

console.log(`Running benchmark with ${ITERATIONS} iterations...`);

const start = performance.now();
const promises = [];
for (let i = 0; i < ITERATIONS; i++) {
    promises.push(decrypt(sampleData));
}
await Promise.all(promises);
const end = performance.now();

console.log(`Total time: ${(end - start).toFixed(2)}ms`);
console.log(`Average time per call: ${((end - start) / ITERATIONS * 1000).toFixed(2)}µs`);
