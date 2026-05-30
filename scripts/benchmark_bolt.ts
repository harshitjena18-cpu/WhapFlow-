import { APP_DOMAIN, API_DOMAIN, LOCALHOST_REGEX } from "../src/supabase/functions/server/constants.ts";

const origin = "https://app.whapflow.com";

function currentCheck(origin: string) {
  if (LOCALHOST_REGEX.test(origin)) {
    return origin;
  }
  if (origin === APP_DOMAIN) {
    return origin;
  }
  if (origin === API_DOMAIN) {
    return origin;
  }
  return undefined;
}

function optimizedCheck(origin: string) {
  if (origin === APP_DOMAIN) {
    return origin;
  }
  if (origin === API_DOMAIN) {
    return origin;
  }
  if (LOCALHOST_REGEX.test(origin)) {
    return origin;
  }
  return undefined;
}

const iterations = 1000000;

console.log(`Running CORS benchmark for ${iterations} iterations with origin: ${origin}`);

const startCurrent = performance.now();
for (let i = 0; i < iterations; i++) {
  currentCheck(origin);
}
const endCurrent = performance.now();

const startOptimized = performance.now();
for (let i = 0; i < iterations; i++) {
  optimizedCheck(origin);
}
const endOptimized = performance.now();

console.log(`Current: ${(endCurrent - startCurrent).toFixed(2)}ms`);
console.log(`Optimized: ${(endOptimized - startOptimized).toFixed(2)}ms`);
console.log(`Improvement: ${(((endCurrent - startCurrent) - (endOptimized - startOptimized)) / (endCurrent - startCurrent) * 100).toFixed(2)}%`);

// Regex Bench
function redactPII_current(text: string): string {
  if (!text) return text;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(?:\+?\d{1,3}[ \-]?)?\(?\d{3}\)?[ \-]?\d{3}[ \-]?\d{4,}/g;

  return text
    .replace(emailRegex, "[REDACTED_EMAIL]")
    .replace(phoneRegex, "[REDACTED_PHONE]");
}

const emailRegexHoisted = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const phoneRegexHoisted = /(?:\+?\d{1,3}[ \-]?)?\(?\d{3}\)?[ \-]?\d{3}[ \-]?\d{4,}/g;
function redactPII_optimized(text: string): string {
  if (!text) return text;
  return text
    .replace(emailRegexHoisted, "[REDACTED_EMAIL]")
    .replace(phoneRegexHoisted, "[REDACTED_PHONE]");
}

const testText = "Contact me at test@example.com or call +1-555-0199 for more info.";
console.log(`\nRunning Regex benchmark for ${iterations} iterations`);

const startRegexCurrent = performance.now();
for (let i = 0; i < iterations; i++) {
  redactPII_current(testText);
}
const endRegexCurrent = performance.now();

const startRegexOptimized = performance.now();
for (let i = 0; i < iterations; i++) {
  redactPII_optimized(testText);
}
const endRegexOptimized = performance.now();

console.log(`Regex Current: ${(endRegexCurrent - startRegexCurrent).toFixed(2)}ms`);
console.log(`Regex Optimized: ${(endRegexOptimized - startRegexOptimized).toFixed(2)}ms`);
console.log(`Regex Improvement: ${(((endRegexCurrent - startRegexCurrent) - (endRegexOptimized - startRegexOptimized)) / (endRegexCurrent - startRegexCurrent) * 100).toFixed(2)}%`);
