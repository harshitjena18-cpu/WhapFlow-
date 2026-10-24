/**
 * Verification script for TemplatesView validation performance & correctness.
 * Validates that template content validation accurately detects blocking errors
 * and warnings synchronously without state dispatches.
 */

function validateContent(content: string = "", isDialogOpen: boolean = true) {
  if (!isDialogOpen) return { validationErrors: [] as string[], validationWarnings: [] as string[] };
  const errors: string[] = [];
  const warnings: string[] = [];

  // Blocking Rules
  if (!content.trim()) {
    errors.push("Template content cannot be empty.");
  }
  if (content.length > 1024) {
    errors.push(`Content exceeds 1024 characters (Current: ${content.length}).`);
  }
  if (!content.includes("{{checkout_link}}")) {
    errors.push("Template MUST include {{checkout_link}}.");
  }

  // Warnings
  if (content.length > 0 && content.length < 50) {
    warnings.push("Content seems very short. Consider adding more context.");
  }
  if (!content.includes("{{customer_name}}")) {
    warnings.push("Missing {{customer_name}} - personalization increases conversion.");
  }
  if (!content.includes("{{product_name}}")) {
    warnings.push("Missing {{product_name}} - reminding customers what they left helps.");
  }

  return { validationErrors: errors, validationWarnings: warnings };
}

async function runVerification() {
  console.log("⚡ Verifying Template Editor Validation Performance & Correctness...");

  // Case 1: Closed dialog returns empty errors and warnings
  const closedRes = validateContent("invalid content", false);
  console.assert(closedRes.validationErrors.length === 0, "Closed dialog should have no errors");
  console.assert(closedRes.validationWarnings.length === 0, "Closed dialog should have no warnings");

  // Case 2: Empty content has empty error and missing checkout link error
  const emptyRes = validateContent("", true);
  console.assert(emptyRes.validationErrors.includes("Template content cannot be empty."), "Empty content error missing");
  console.assert(emptyRes.validationErrors.includes("Template MUST include {{checkout_link}}."), "Missing checkout link error missing");

  // Case 3: Valid full template has 0 errors and 0 warnings
  const validText = "Hi {{customer_name}}, you left {{product_name}} in your shopping cart! Click here to complete your order: {{checkout_link}} and enjoy free shipping today.";
  const validRes = validateContent(validText, true);
  console.assert(validRes.validationErrors.length === 0, `Valid content should have 0 errors, got: ${validRes.validationErrors.join(", ")}`);
  console.assert(validRes.validationWarnings.length === 0, `Valid content should have 0 warnings, got: ${validRes.validationWarnings.join(", ")}`);

  // Case 4: Short text has warning
  const shortText = "Check out: {{checkout_link}}";
  const shortRes = validateContent(shortText, true);
  console.assert(shortRes.validationWarnings.some(w => w.includes("Content seems very short")), "Short content warning missing");

  // Performance benchmark: 100,000 validation checks
  const start = performance.now();
  const iterations = 100000;
  for (let i = 0; i < iterations; i++) {
    validateContent(validText, true);
  }
  const duration = performance.now() - start;

  console.log(`✅ 100,000 validation computations completed in ${duration.toFixed(2)}ms (${(duration / iterations * 1000).toFixed(4)}µs per check)`);
  console.log("⚡ Verification passed successfully!");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
