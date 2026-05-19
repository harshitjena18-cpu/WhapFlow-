
import { redactPII } from "../src/lib/error.ts";

async function runVerification() {
  const testText = "Contact me at jules@example.com or +1 (555) 123-4567 for more info.";
  const redacted = redactPII(testText);

  console.log("Input:", testText);
  console.log("Output:", redacted);

  if (redacted.includes("jules@example.com") || redacted.includes("555")) {
    console.error("❌ REDACTION FAILED");
    process.exit(1);
  }

  console.log("✅ REDACTION SUCCESSFUL");

  const iterations = 100000;
  console.log(`⚡ Benchmarking production redactPII (${iterations} iterations)`);

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    redactPII(testText);
  }
  const end = performance.now();
  const time = end - start;
  console.log(`Time: ${time.toFixed(2)}ms (${(time / iterations * 1000).toFixed(2)}µs/call)`);
}

runVerification().catch(console.error);
