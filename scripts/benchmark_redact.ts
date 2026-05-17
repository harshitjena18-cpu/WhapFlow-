import { redactPII } from "../src/lib/error.ts";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?\d{1,3}[ \-]?)?\(?\d{3}\)?[ \-]?\d{3}[ \-]?\d{4,}/g;

function redactPII_local(text: string): string {
  if (!text) return text;
  // Regex for emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  // Regex for common phone number formats (7+ digits)
  // Optimized to reduce backtracking and handle varied delimiters safely
  const phoneRegex = /(?:\+?\d{1,3}[ \-]?)?\(?\d{3}\)?[ \-]?\d{3}[ \-]?\d{4,}/g;

  return text
    .replace(emailRegex, "[REDACTED_EMAIL]")
    .replace(phoneRegex, "[REDACTED_PHONE]");
}

function redactPII_hoisted(text: string): string {
  if (!text) return text;

  return text
    .replace(EMAIL_REGEX, "[REDACTED_EMAIL]")
    .replace(PHONE_REGEX, "[REDACTED_PHONE]");
}


const testData = "Contact us at support@whapflow.com or call +1-555-0199 for help.";
const iterations = 1000000;

console.log(`Running redactPII micro-benchmark with ${iterations} iterations...\n`);

console.time("redactPII_local");
for (let i = 0; i < iterations; i++) {
    redactPII_local(testData);
}
console.timeEnd("redactPII_local");

console.time("redactPII_hoisted");
for (let i = 0; i < iterations; i++) {
    redactPII_hoisted(testData);
}
console.timeEnd("redactPII_hoisted");

console.time("redactPII_imported (should be hoisted)");
for (let i = 0; i < iterations; i++) {
    redactPII(testData);
}
console.timeEnd("redactPII_imported (should be hoisted)");
