
import { redactPII } from "../src/lib/error.ts";

const SAMPLE_TEXT = "Error processing request for customer Jules (jules@example.com) with phone +1234567890. Stack trace: at fetch (node:internal/deps/undici/undici:11452:11) at process.processTicksAndRejections (node:internal/process/task_queues:95:5)";

function benchmark(iterations: number) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    redactPII(SAMPLE_TEXT);
  }
  return performance.now() - start;
}

console.log("Running benchmark for redactPII...");
const iterations = 100000;
const time = benchmark(iterations);
console.log(`Time for ${iterations} iterations: ${time.toFixed(2)}ms`);
console.log(`Average time per call: ${(time / iterations * 1000).toFixed(4)}µs`);
