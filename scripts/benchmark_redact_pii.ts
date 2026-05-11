import { redactPII } from "../src/lib/error.ts";

const sampleText = "Contact us at support@example.com or call +1 555-0199. Also reached me at john.doe@work.co or 123-456-7890. ".repeat(10);

function benchmark() {
  const iterations = 100000;
  console.log(`Running benchmark with ${iterations} iterations...`);

  // Warm up
  for (let i = 0; i < 1000; i++) {
    redactPII(sampleText);
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    redactPII(sampleText);
  }
  const end = performance.now();

  const totalTime = end - start;
  const avgTime = totalTime / iterations;

  console.log(`Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`Average time: ${(avgTime * 1000).toFixed(4)}µs`);
}

benchmark();
