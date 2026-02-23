// scripts/verify_scan_queue_logic.ts

const PREFIX = "queue:v1:";
const NOW_ISO = "2024-05-20T12:00:00.000Z";
const END_KEY = `${PREFIX}${NOW_ISO}`;

const TEST_KEYS = [
  "apple",
  "queue:v0:something",
  "queue:v1",             // Shorter than prefix
  "queue:v1:",            // Exactly prefix
  "queue:v1:2023-01-01",  // Before endKey
  "queue:v1:2024-05-20T11:59:59.999Z", // Just before endKey
  END_KEY,                // Exactly endKey
  "queue:v1:2024-05-20T12:00:00.001Z", // Just after endKey
  "queue:v1:z",           // Way after endKey
  "queue:v2:something",   // Different version
  "zebra"
];

function checkLike(key: string, prefix: string, endKey: string) {
  return key.startsWith(prefix) && key <= endKey;
}

function checkRange(key: string, prefix: string, endKey: string) {
  return key >= prefix && key <= endKey;
}

console.log(`Prefix: ${PREFIX}`);
console.log(`EndKey: ${END_KEY}`);
console.log("------------------------------------------------------------------");
console.log("| Key                                | LIKE  | RANGE | Match? |");
console.log("|------------------------------------|-------|-------|--------|");

let allMatch = true;

for (const key of TEST_KEYS) {
  const likeRes = checkLike(key, PREFIX, END_KEY);
  const rangeRes = checkRange(key, PREFIX, END_KEY);
  const match = likeRes === rangeRes;

  if (!match) allMatch = false;

  console.log(`| ${key.padEnd(34)} | ${String(likeRes).padEnd(5)} | ${String(rangeRes).padEnd(5)} | ${match ? "✅" : "❌"}    |`);
}

if (allMatch) {
  console.log("\n✅ Verification Successful: Logic is equivalent for the tested keys.");
} else {
  console.error("\n❌ Verification Failed: Logic mismatch detected.");
  process.exit(1);
}
