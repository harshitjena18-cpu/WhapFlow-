
/**
 * scripts/benchmark_redact_pii.ts
 *
 * Benchmarks regex hoisting in redactPII.
 */

function redactPII_Original(text: string): string {
  if (!text) return text;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(?:\+?\d{1,3}[ \-]?)?\(?\d{3}\)?[ \-]?\d{3}[ \-]?\d{4,}/g;

  return text
    .replace(emailRegex, "[REDACTED_EMAIL]")
    .replace(phoneRegex, "[REDACTED_PHONE]");
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?\d{1,3}[ \-]?)?\(?\d{3}\)?[ \-]?\d{3}[ \-]?\d{4,}/g;

function redactPII_Optimized(text: string): string {
  if (!text) return text;
  return text
    .replace(EMAIL_REGEX, "[REDACTED_EMAIL]")
    .replace(PHONE_REGEX, "[REDACTED_PHONE]");
}

async function runBenchmark() {
  const iterations = 100000;
  const testText = "Contact me at jules@example.com or +1 (555) 123-4567 for more info. Another email: test.user@company.co.uk";

  console.log(`⚡ Benchmarking redactPII (${iterations} iterations)`);

  // Warmup
  for (let i = 0; i < 1000; i++) {
    redactPII_Original(testText);
    redactPII_Optimized(testText);
  }

  const startOriginal = performance.now();
  for (let i = 0; i < iterations; i++) {
    redactPII_Original(testText);
  }
  const endOriginal = performance.now();
  const timeOriginal = endOriginal - startOriginal;

  const startOptimized = performance.now();
  for (let i = 0; i < iterations; i++) {
    redactPII_Optimized(testText);
  }
  const endOptimized = performance.now();
  const timeOptimized = endOptimized - startOptimized;

  console.log(`Original:  ${timeOriginal.toFixed(2)}ms (${(timeOriginal / iterations * 1000).toFixed(2)}µs/call)`);
  console.log(`Optimized: ${timeOptimized.toFixed(2)}ms (${(timeOptimized / iterations * 1000).toFixed(2)}µs/call)`);
  console.log(`Improvement: ${((timeOriginal - timeOptimized) / timeOriginal * 100).toFixed(2)}%`);
}

runBenchmark().catch(console.error);
