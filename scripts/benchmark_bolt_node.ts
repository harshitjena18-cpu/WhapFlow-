const APP_DOMAIN = "https://app.whapflow.com";
const API_DOMAIN = "https://api.whapflow.com";
const LOCALHOST_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

const origin = "https://app.whapflow.com";

function currentCheck(origin) {
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

function optimizedCheck(origin) {
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

const startCurrent = Date.now();
for (let i = 0; i < iterations; i++) {
  currentCheck(origin);
}
const endCurrent = Date.now();

const startOptimized = Date.now();
for (let i = 0; i < iterations; i++) {
  optimizedCheck(origin);
}
const endOptimized = Date.now();

console.log(`Current: ${(endCurrent - startCurrent)}ms`);
console.log(`Optimized: ${(endOptimized - startOptimized)}ms`);
console.log(`Improvement: ${(((endCurrent - startCurrent) - (endOptimized - startOptimized)) / (endCurrent - startCurrent) * 100).toFixed(2)}%`);

// Regex Bench
function redactPII_current(text) {
  if (!text) return text;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(?:\+?\d{1,3}[ \-]?)?\(?\d{3}\)?[ \-]?\d{3}[ \-]?\d{4,}/g;

  return text
    .replace(emailRegex, "[REDACTED_EMAIL]")
    .replace(phoneRegex, "[REDACTED_PHONE]");
}

const emailRegexHoisted = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const phoneRegexHoisted = /(?:\+?\d{1,3}[ \-]?)?\(?\d{3}\)?[ \-]?\d{3}[ \-]?\d{4,}/g;
function redactPII_optimized(text) {
  if (!text) return text;
  return text
    .replace(emailRegexHoisted, "[REDACTED_EMAIL]")
    .replace(phoneRegexHoisted, "[REDACTED_PHONE]");
}

const testText = "Contact me at test@example.com or call +1-555-0199 for more info.";
console.log(`\nRunning Regex benchmark for ${iterations} iterations`);

const startRegexCurrent = Date.now();
for (let i = 0; i < iterations; i++) {
  redactPII_current(testText);
}
const endRegexCurrent = Date.now();

const startRegexOptimized = Date.now();
for (let i = 0; i < iterations; i++) {
  redactPII_optimized(testText);
}
const endRegexOptimized = Date.now();

console.log(`Regex Current: ${(endRegexCurrent - startRegexCurrent)}ms`);
console.log(`Regex Optimized: ${(endRegexOptimized - startRegexOptimized)}ms`);
console.log(`Regex Improvement: ${(((endRegexCurrent - startRegexCurrent) - (endRegexOptimized - startRegexOptimized)) / (endRegexCurrent - startRegexCurrent) * 100).toFixed(2)}%`);
