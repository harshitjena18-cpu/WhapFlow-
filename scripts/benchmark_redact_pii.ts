import { redactPII } from "../src/lib/error.ts";

const iterations = 100_000;
const text = "Contact me at john.doe@example.com or call +1 (555) 123-4567 for more info. Another email: jane@shop.co";

console.log("Benchmarking redactPII...");

const start = performance.now();
for (let i = 0; i < iterations; i++) {
  redactPII(text);
}
const end = performance.now();
console.log(`Current: ${(end - start).toFixed(2)}ms`);

// Optimized version logic (simulated)
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const phoneRegex = /(?:\+?\d{1,3}[ \-]?)?\(?\d{3}\)?[ \-]?\d{3}[ \-]?\d{4,}/g;

function redactPIIOptimized(text: string): string {
  if (!text) return text;
  return text
    .replace(emailRegex, "[REDACTED_EMAIL]")
    .replace(phoneRegex, "[REDACTED_PHONE]");
}

const startOpt = performance.now();
for (let i = 0; i < iterations; i++) {
  redactPIIOptimized(text);
}
const endOpt = performance.now();
console.log(`Optimized: ${(endOpt - startOpt).toFixed(2)}ms`);

const improvement = ((end - start) - (endOpt - startOpt)) / (end - start) * 100;
console.log(`Improvement: ${improvement.toFixed(2)}%`);
