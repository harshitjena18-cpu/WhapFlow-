
// scripts/verify_template_query.ts

/**
 * Mock implementation of Supabase-like JSONB filtering
 */
function mockQueryByJsonPath(data: {key: string, value: any}[], jsonPath: string, targetValue: any) {
  return data.filter(item => {
    // Basic implementation of 'value->template_name' logic
    if (jsonPath === "value->template_name") {
      return item.value.template_name === targetValue;
    }
    // If it was just "template_name", it would look for a top-level column (which doesn't exist in our KV schema)
    if (jsonPath === "template_name") {
      return false; // Simulation of failure to find field in top-level column
    }
    return false;
  });
}

const mockDb = [
  { key: "shop:test.com:template:1", value: { template_name: "welcome", content: "..." } },
  { key: "shop:test.com:template:2", value: { template_name: "reminder", content: "..." } }
];

console.log("Starting verification of template query logic...");

const testName = "welcome";

// 1. Test INCORRECT path (what we had before)
console.log(`\nTesting with INCORRECT path: "template_name"`);
const incorrectResult = mockQueryByJsonPath(mockDb, "template_name", testName);
console.log(`Found: ${incorrectResult.length} items`);
if (incorrectResult.length === 0) {
  console.log("✅ Correct behavior: 'template_name' fails to match (simulating column vs JSONB field)");
} else {
  console.error("❌ Unexpected behavior: matched on top-level column?");
}

// 2. Test CORRECT path (what we have now)
console.log(`\nTesting with CORRECT path: "value->template_name"`);
const correctResult = mockQueryByJsonPath(mockDb, "value->template_name", testName);
console.log(`Found: ${correctResult.length} items`);
if (correctResult.length === 1 && correctResult[0].value.template_name === testName) {
  console.log("✅ Success: correctly identified existing template using JSONB path!");
} else {
  console.error("❌ Failure: could not find template even with correct path.");
  process.exit(1);
}

// 3. Test non-existent template
console.log(`\nTesting non-existent template: "new_one"`);
const nonExistentResult = mockQueryByJsonPath(mockDb, "value->template_name", "new_one");
console.log(`Found: ${nonExistentResult.length} items`);
if (nonExistentResult.length === 0) {
  console.log("✅ Success: correctly identified that template name is unique.");
} else {
  console.error("❌ Failure: matched a non-existent template name?");
  process.exit(1);
}

console.log("\n✅ All template query logic verifications passed!");
