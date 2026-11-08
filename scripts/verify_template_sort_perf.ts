/**
 * Verification and benchmark for template sorting optimization.
 * Compares new Date().getTime() sorting vs direct ISO 8601 string comparison.
 */

interface TemplateItem {
  id: string;
  created_at: string;
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("⚡ Bolt: Verifying template list sorting correctness and performance...");

// 1. Correctness Verification
const sampleDates: string[] = [
  "2023-01-01T00:00:00.000Z",
  "2023-01-01T00:00:00.001Z",
  "2023-01-02T12:30:45.123Z",
  "2023-12-31T23:59:59.999Z",
  "2024-02-29T10:00:00.000Z", // Leap year
  "2024-05-15T08:12:34.567Z",
  "2024-11-08T13:30:00.000Z",
  "2025-01-01T00:00:00.000Z",
  "2026-04-12T19:45:10.890Z",
];

const mockTemplates: TemplateItem[] = sampleDates.map((date, idx) => ({
  id: `template_${idx}`,
  created_at: date,
}));

// Shuffle helper
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const shuffled1 = shuffle(mockTemplates);
const shuffled2 = [...shuffled1];

// Legacy sort (Date parsing)
shuffled1.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

// Optimized sort (Direct string compare)
shuffled2.sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));

// Assert exact equivalence
assert(shuffled1.length === shuffled2.length, "Sorted array lengths must match");
for (let i = 0; i < shuffled1.length; i++) {
  assert(
    shuffled1[i].id === shuffled2[i].id && shuffled1[i].created_at === shuffled2[i].created_at,
    `Element mismatch at index ${i}: expected ${shuffled1[i].id}, got ${shuffled2[i].id}`
  );
}
console.log("✅ Correctness check: ISO 8601 string sort produces identical descending order to new Date().getTime().");

// 2. Performance Benchmark
const NUM_TEMPLATES = 500;
const ITERATIONS = 200;

const benchmarkTemplates: TemplateItem[] = [];
const baseTime = Date.now();
for (let i = 0; i < NUM_TEMPLATES; i++) {
  benchmarkTemplates.push({
    id: `template_${i}`,
    // Ensure varied ISO strings
    created_at: new Date(baseTime - Math.floor(Math.random() * 1000000000)).toISOString(),
  });
}

// Warmup
for (let i = 0; i < 10; i++) {
  [...benchmarkTemplates].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  [...benchmarkTemplates].sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));
}

// Benchmark Legacy Date Parsing
const startLegacy = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  const list = [...benchmarkTemplates];
  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
const legacyTime = performance.now() - startLegacy;

// Benchmark Optimized String Comparison
const startOptimized = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  const list = [...benchmarkTemplates];
  list.sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));
}
const optimizedTime = performance.now() - startOptimized;

const speedup = legacyTime / optimizedTime;

console.log("\n📊 Benchmark Results:");
console.log(`  Legacy (Date parsing):        ${legacyTime.toFixed(2)} ms (${(legacyTime / ITERATIONS).toFixed(3)} ms/op)`);
console.log(`  Optimized (Direct string):    ${optimizedTime.toFixed(2)} ms (${(optimizedTime / ITERATIONS).toFixed(3)} ms/op)`);
console.log(`  Speedup:                      ${speedup.toFixed(2)}x faster`);
console.log(`  Allocation Overhead:          0 Date instances created per sort in optimized implementation.`);

console.log("\n✨ All template sorting verification tests passed!");
