import { redactPII } from "../src/lib/error.ts";
import { APP_DOMAIN, API_DOMAIN, LOCALHOST_REGEX } from "../src/supabase/functions/server/constants.ts";

// Current logic from src/supabase/functions/server/index.tsx
function currentCors(origin: string | undefined) {
    if (!origin) return origin;
    if (LOCALHOST_REGEX.test(origin)) return origin;
    if (origin === APP_DOMAIN) return origin;
    if (origin === API_DOMAIN) return origin;
    return undefined;
}

// Proposed optimized logic
function optimizedCors(origin: string | undefined) {
    if (!origin) return origin;
    if (origin === APP_DOMAIN) return origin;
    if (origin === API_DOMAIN) return origin;
    if (LOCALHOST_REGEX.test(origin)) return origin;
    return undefined;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?\d{1,3}[ \-]?)?\(?\d{3}\)?[ \-]?\d{3}[ \-]?\d{4,}/g;

function optimizedRedactPII(text: string): string {
  if (!text) return text;
  return text
    .replace(EMAIL_REGEX, "[REDACTED_EMAIL]")
    .replace(PHONE_REGEX, "[REDACTED_PHONE]");
}

const testData = "Contact us at support@whapflow.com or call +1-555-0199 for help.";
const iterations = 1000000; // Increased for better resolution

console.log(`Running benchmarks with ${iterations} iterations...\n`);

// redactPII Benchmark
console.time("redactPII (current)");
for (let i = 0; i < iterations; i++) {
    redactPII(testData);
}
console.timeEnd("redactPII (current)");

console.time("redactPII (optimized)");
for (let i = 0; i < iterations; i++) {
    optimizedRedactPII(testData);
}
console.timeEnd("redactPII (optimized)");

console.log("\n--- CORS Benchmark (Production Origin: APP_DOMAIN) ---");

console.time("CORS (current)");
for (let i = 0; i < iterations; i++) {
    currentCors(APP_DOMAIN);
}
console.timeEnd("CORS (current)");

console.time("CORS (optimized)");
for (let i = 0; i < iterations; i++) {
    optimizedCors(APP_DOMAIN);
}
console.timeEnd("CORS (optimized)");
