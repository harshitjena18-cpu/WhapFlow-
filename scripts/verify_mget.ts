
// scripts/verify_mget.ts

// Mocking the Map-based mapping logic used in the new mget
function mockMgetLogic(keys: string[], data: {key: string, value: any}[]) {
  const resultsMap = new Map(data.map((item) => [item.key, item.value]));
  return keys.map((key) => resultsMap.get(key) ?? null);
}

const testKeys = ["key1", "key2", "key3", "key4"];
const mockData = [
  { key: "key3", value: "value3" },
  { key: "key1", value: "value1" },
  // key2 and key4 are missing
];

console.log("Testing mget mapping logic...");
const results = mockMgetLogic(testKeys, mockData);

console.log("Requested Keys:", testKeys);
console.log("Mock DB Data:", mockData);
console.log("Results:", results);

const expected = ["value1", null, "value3", null];

let success = true;
for (let i = 0; i < expected.length; i++) {
  if (results[i] !== expected[i]) {
    console.error(`Mismatch at index ${i}: expected ${expected[i]}, got ${results[i]}`);
    success = false;
  }
}

if (success) {
  console.log("✅ mget logic verification successful!");
} else {
  console.error("❌ mget logic verification failed!");
  process.exit(1);
}
