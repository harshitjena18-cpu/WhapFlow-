
const EMAIL_REGEX_HOISTED = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX_HOISTED = /(?:\+?\d{1,3}[ \-]?)?\(?\d{3}\)?[ \-]?\d{3}[ \-]?\d{4,}/g;

function redactPII_hoisted(text: string): string {
  if (!text) return text;
  return text
    .replace(EMAIL_REGEX_HOISTED, "[REDACTED_EMAIL]")
    .replace(PHONE_REGEX_HOISTED, "[REDACTED_PHONE]");
}

function redactPII_local(text: string): string {
  if (!text) return text;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(?:\+?\d{1,3}[ \-]?)?\(?\d{3}\)?[ \-]?\d{3}[ \-]?\d{4,}/g;
  return text
    .replace(emailRegex, "[REDACTED_EMAIL]")
    .replace(phoneRegex, "[REDACTED_PHONE]");
}

const ITERATIONS = 100000;
const TEST_TEXT = "Contact support at support@example.com or call +1 555-0199 for assistance. User name: John Doe, Email: john.doe@provider.org, Phone: (555) 123-4567.";

console.log(`⚡ RedactPII Hoisting Benchmark (${ITERATIONS} iterations)`);

// Warmup
for (let i = 0; i < 10000; i++) {
    redactPII_local(TEST_TEXT);
    redactPII_hoisted(TEST_TEXT);
}

const startLocal = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    redactPII_local(TEST_TEXT);
}
const endLocal = performance.now();

const startHoisted = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    redactPII_hoisted(TEST_TEXT);
}
const endHoisted = performance.now();

console.log(`- Local (Allocating in loop): ${(endLocal - startLocal).toFixed(4)}ms`);
console.log(`- Hoisted:                   ${(endHoisted - startHoisted).toFixed(4)}ms`);
console.log(`- Speedup:                    ${((endLocal - startLocal) / (endHoisted - startHoisted)).toFixed(2)}x`);
