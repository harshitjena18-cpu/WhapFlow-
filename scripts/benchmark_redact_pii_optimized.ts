const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?\d{1,3}[ \-]?)?\(?\d{3}\)?[ \-]?\d{3}[ \-]?\d{4,}/g;

export function redactPII_optimized(text: string): string {
  if (!text) return text;
  return text
    .replace(EMAIL_REGEX, "[REDACTED_EMAIL]")
    .replace(PHONE_REGEX, "[REDACTED_PHONE]");
}

const sampleText = "Contact us at support@example.com or call +1 555-0199. Also reached me at john.doe@work.co or 123-456-7890. ".repeat(10);

function benchmark() {
  const iterations = 100000;
  console.log(`Running optimized benchmark with ${iterations} iterations...`);

  // Warm up
  for (let i = 0; i < 1000; i++) {
    redactPII_optimized(sampleText);
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    redactPII_optimized(sampleText);
  }
  const end = performance.now();

  const totalTime = end - start;
  const avgTime = totalTime / iterations;

  console.log(`Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`Average time: ${(avgTime * 1000).toFixed(4)}µs`);
}

benchmark();
