
import { redactPII } from "../src/lib/error.ts";

const sampleLogs = [
    "Error processing request for user test@example.com",
    "Failed to send message to +1234567890",
    "Database error at 2023-01-01T00:00:00Z for merchant shop.myshopify.com",
    "Invalid token for customer with email: another.test+regex@gmail.co.uk and phone (555) 123-4567",
    "Normal log message without PII"
];

const ITERATIONS = 10000;

console.log(`Running benchmark with ${ITERATIONS} iterations...`);

const start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    for (const log of sampleLogs) {
        redactPII(log);
    }
}
const end = performance.now();

console.log(`Total time: ${(end - start).toFixed(2)}ms`);
console.log(`Average time per call: ${((end - start) / (ITERATIONS * sampleLogs.length) * 1000).toFixed(2)}µs`);
