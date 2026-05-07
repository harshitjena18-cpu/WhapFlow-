
import { redactPII } from "../src/lib/error.ts";

const sampleLogs = [
    "Error processing request for user test@example.com",
    "Failed to send message to +1234567890",
    "Database error at 2023-01-01T00:00:00Z for merchant shop.myshopify.com",
    "Invalid token for customer with email: another.test+regex@gmail.co.uk and phone (555) 123-4567",
    "Normal log message without PII"
];

const emailRegexHoisted = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const phoneRegexHoisted = /(?:\+?\d{1,3}[ \-]?)?\(?\d{3}\)?[ \-]?\d{3}[ \-]?\d{4,}/g;

function redactPII_hoisted(text: string): string {
  if (!text) return text;
  return text
    .replace(emailRegexHoisted, "[REDACTED_EMAIL]")
    .replace(phoneRegexHoisted, "[REDACTED_PHONE]");
}

const ITERATIONS = 100000;

console.log(`Running benchmark with ${ITERATIONS} iterations...`);

let start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    for (const log of sampleLogs) {
        redactPII(log);
    }
}
let end = performance.now();
const originalTime = end - start;
console.log(`Original total time: ${originalTime.toFixed(2)}ms`);

start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    for (const log of sampleLogs) {
        redactPII_hoisted(log);
    }
}
end = performance.now();
const hoistedTime = end - start;
console.log(`Hoisted total time: ${hoistedTime.toFixed(2)}ms`);

console.log(`Improvement: ${(((originalTime - hoistedTime) / originalTime) * 100).toFixed(2)}%`);
