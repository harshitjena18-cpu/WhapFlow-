
import { redactPII } from "../src/lib/error.ts";

function benchmark() {
  const iterations = 1000000;
  const testString = "Contact me at john.doe@example.com or call +1 555-123-4567 for more info. Another email: jane@web.co";

  // Warm up
  for (let i = 0; i < 10000; i++) {
    redactPII(testString);
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    redactPII(testString);
  }
  const end = performance.now();

  console.log(`⚡ Benchmark: redactPII (${iterations} iterations)`);
  console.log(`Total Time: ${(end - start).toFixed(2)}ms`);
  console.log(`Average Time: ${((end - start) / iterations * 1000).toFixed(4)}µs`);
}

benchmark();
