import { redactPII } from "../src/lib/error.ts";

const text = "Email: test@example.com, Phone: +1 555-123-4567, Other: regular text";
const redacted = redactPII(text);
console.log("Original:", text);
console.log("Redacted:", redacted);

if (redacted.includes("test@example.com")) {
  console.error("FAIL: Email not redacted");
  process.exit(1);
}
if (redacted.includes("555-123-4567")) {
  console.error("FAIL: Phone not redacted");
  process.exit(1);
}
console.log("PASS: PII redacted successfully");
