// Simulate the current behavior of shopifyGraphql error handling
function currentLogic(errors) {
  if (errors) {
     console.log(`[ShopifyGraphQL] GraphQL Errors:`, errors);
     // We'll throw the first error message to simplify handling
     throw new Error(errors[0]?.message || "GraphQL Error");
  }
}

function improvedLogic(errors) {
  if (errors && errors.length > 0) {
      console.log(`[ShopifyGraphQL] GraphQL Errors:`, errors);
      const messages = errors.map((e) => e.message).join(", ");
      throw new Error(`GraphQL Error: ${messages}`);
  }
}

const testErrors = [
  { message: "Error 1: Invalid ID" },
  { message: "Error 2: Throttle limit reached" }
];

console.log("--- Testing Current Logic ---");
try {
  currentLogic(testErrors);
} catch (e) {
  console.log("Caught:", e.message);
}

console.log("\n--- Testing Improved Logic ---");
try {
  improvedLogic(testErrors);
} catch (e) {
  console.log("Caught:", e.message);
}
