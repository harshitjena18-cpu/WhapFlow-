
import { redactPII as originalRedactPII } from "../src/lib/error.ts";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?\d{1,3}[ \-]?)?\(?\d{3}\)?[ \-]?\d{3}[ \-]?\d{4,}/g;

function optimizedRedactPII(text: string): string {
  if (!text) return text;
  return text
    .replace(EMAIL_REGEX, "[REDACTED_EMAIL]")
    .replace(PHONE_REGEX, "[REDACTED_PHONE]");
}

const SAMPLE_TEXT = "Error processing request for customer Jules (jules@example.com) with phone +1234567890. Stack trace: at fetch (node:internal/deps/undici/undici:11452:11) at process.processTicksAndRejections (node:internal/process/task_queues:95:5)";

function benchmark(fn: (t: string) => string, iterations: number) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn(SAMPLE_TEXT);
  }
  return performance.now() - start;
}

const iterations = 500000;
console.log(`Running benchmark with ${iterations} iterations...`);

const originalTime = benchmark(originalRedactPII, iterations);
console.log(`Original: ${originalTime.toFixed(2)}ms (${(originalTime / iterations * 1000).toFixed(4)}µs/call)`);

const optimizedTime = benchmark(optimizedRedactPII, iterations);
console.log(`Optimized: ${optimizedTime.toFixed(2)}ms (${(optimizedTime / iterations * 1000).toFixed(4)}µs/call)`);

console.log(`Improvement: ${((originalTime - optimizedTime) / originalTime * 100).toFixed(2)}%`);
