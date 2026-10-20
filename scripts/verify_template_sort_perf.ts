// scripts/verify_template_sort_perf.ts

interface AutomationTemplate {
  id: string;
  template_name: string;
  display_name: string;
  delay_minutes: number;
  content?: string;
  enabled: boolean;
  created_at: string;
}

// Generate sample templates with ISO 8601 date strings
function generateSampleTemplates(count: number): AutomationTemplate[] {
  const templates: AutomationTemplate[] = [];
  const baseTime = new Date("2025-01-01T00:00:00.000Z").getTime();

  for (let i = 0; i < count; i++) {
    // Generate dates scattered across time
    const randomOffset = Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000);
    const dateStr = new Date(baseTime + randomOffset).toISOString();
    templates.push({
      id: `id-${i}`,
      template_name: `template_${i}`,
      display_name: `Template ${i}`,
      delay_minutes: 30,
      enabled: i % 2 === 0,
      created_at: dateStr,
    });
  }
  return templates;
}

console.log("=== Template Sort Performance Verification ===");

// Benchmark setup
const sampleSize = 1000;
const iterations = 500;
const templatesToTest = generateSampleTemplates(sampleSize);

// Method A: Date object instantiation (original)
function sortWithDateParsing(arr: AutomationTemplate[]): AutomationTemplate[] {
  const clone = [...arr];
  clone.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return clone;
}

// Method B: Direct ISO string comparison (optimized)
function sortWithStringCompare(arr: AutomationTemplate[]): AutomationTemplate[] {
  const clone = [...arr];
  clone.sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));
  return clone;
}

// 1. Verify equivalence
console.log("\n1. Verifying equivalence between methods...");
const sortedA = sortWithDateParsing(templatesToTest);
const sortedB = sortWithStringCompare(templatesToTest);

let isEquivalent = sortedA.length === sortedB.length;
if (isEquivalent) {
  for (let i = 0; i < sortedA.length; i++) {
    if (sortedA[i].id !== sortedB[i].id) {
      isEquivalent = false;
      console.error(`Mismatch at index ${i}: Date sort gave ${sortedA[i].id}, String sort gave ${sortedB[i].id}`);
      break;
    }
  }
}

if (isEquivalent) {
  console.log("✅ Both sorting methods produce identical output order!");
} else {
  console.error("❌ Sorting methods output differed!");
  process.exit(1);
}

// 2. Performance benchmark
console.log(`\n2. Running benchmark (${iterations} iterations on ${sampleSize} items)...`);

// Warmup
for (let i = 0; i < 50; i++) {
  sortWithDateParsing(templatesToTest);
  sortWithStringCompare(templatesToTest);
}

const startA = performance.now();
for (let i = 0; i < iterations; i++) {
  sortWithDateParsing(templatesToTest);
}
const durationA = performance.now() - startA;

const startB = performance.now();
for (let i = 0; i < iterations; i++) {
  sortWithStringCompare(templatesToTest);
}
const durationB = performance.now() - startB;

console.log(`Method A (new Date().getTime()): ${durationA.toFixed(2)}ms`);
console.log(`Method B (Direct String Compare): ${durationB.toFixed(2)}ms`);

const speedup = (durationA / durationB).toFixed(2);
console.log(`⚡ Direct string comparison is ${speedup}x faster!`);

if (durationB < durationA) {
  console.log("✅ Performance optimization verified successfully!");
} else {
  console.error("❌ Performance optimization was not faster.");
  process.exit(1);
}
