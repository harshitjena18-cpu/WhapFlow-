
import { redactPII } from "../src/lib/error.ts";

const sampleText = `
  Hello, my email is test@example.com and my phone number is +1 (555) 123-4567.
  Please contact me at support@whapflow.com if you have any questions.
  My other phone is 555-987-6543.
  Random error message with PII: failed to process order for user@gmail.com.
`;

const ITERATIONS = 200000;

function runBenchmark() {
  console.log(`Running optimized redactPII benchmark with ${ITERATIONS} iterations...`);

  // Warm up
  for (let i = 0; i < 1000; i++) {
    redactPII(sampleText);
  }

  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    redactPII(sampleText);
  }
  const end = performance.now();

  console.log(`Optimized redactPII: ${Math.round(end - start)}ms`);
  console.log(`Average time: ${(end - start) / ITERATIONS}ms`);
}

runBenchmark();
