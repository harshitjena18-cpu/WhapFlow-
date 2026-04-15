import { redactPII } from "../src/lib/error.ts";

const testCases = [
    "Error sending to +15550109999", // US formatted-ish
    "Error sending to +442071234567", // UK
    "Invalid number: 12345678901", // 11 digits
    "Contact me at user@example.com or +1 555-010-9999",
    "Failed for +1234567890", // 10 digits
    "Log for user with ID 123456789012345"
];

console.log("PII Redaction Test:");
testCases.forEach(tc => {
    console.log(`Original: ${tc}`);
    console.log(`Redacted: ${redactPII(tc)}`);
    console.log("---");
});
