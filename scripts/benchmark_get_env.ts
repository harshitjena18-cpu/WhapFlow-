import { getEnv } from '../src/lib/env.ts';

const ITERATIONS = 1_000_000;
const KEY = 'TEST_KEY';

// Ensure a process env exists for the benchmark if running in Node-like env
if (!(globalThis as any).process) {
  (globalThis as any).process = { env: {} };
}
(globalThis as any).process.env[KEY] = 'test_value';

console.log(`Benchmarking getEnv with ${ITERATIONS.toLocaleString()} iterations...`);

// Warm up
for (let i = 0; i < 10000; i++) {
  getEnv(KEY);
}

const start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  getEnv(KEY);
}
const end = performance.now();

const totalTime = end - start;
console.log(`Total time: ${totalTime.toFixed(2)}ms`);
console.log(`Average time per call: ${(totalTime / ITERATIONS * 1000).toFixed(4)}µs`);
