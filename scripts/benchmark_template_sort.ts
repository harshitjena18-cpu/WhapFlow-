// scripts/benchmark_template_sort.ts

interface Template {
  id: string;
  template_name: string;
  created_at: string;
}

// Generate realistic template dates spread over years
function generateMockTemplates(count: number): Template[] {
  const templates: Template[] = [];
  const baseTime = new Date("2024-01-01T00:00:00.000Z").getTime();

  for (let i = 0; i < count; i++) {
    // Generate dates incrementing by random minutes
    const randomOffsetMs = i * 15 * 60 * 1000 + Math.floor(Math.random() * 100000);
    const dateStr = new Date(baseTime + randomOffsetMs).toISOString();

    templates.push({
      id: `tmpl_${i}`,
      template_name: `Template Name ${i}`,
      created_at: dateStr
    });
  }

  // Shuffle them so sorting has to actually work
  return templates.sort(() => Math.random() - 0.5);
}

const TEMPLATE_COUNT = 1000;
const ITERATIONS = 5000;

console.log(`🚀 Starting Template Sorting Optimization Benchmark`);
console.log(`Template Count per Sort: ${TEMPLATE_COUNT}`);
console.log(`Sorting Iterations:      ${ITERATIONS}\n`);

// 1. Baseline: new Date().getTime()
const baselineTemplates = generateMockTemplates(TEMPLATE_COUNT);
let totalBaselineTime = 0;

console.log("Measuring Baseline Sorting (new Date().getTime())...");
for (let i = 0; i < ITERATIONS; i++) {
  const arr = [...baselineTemplates];
  const start = performance.now();
  arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  totalBaselineTime += (performance.now() - start);
}

// 2.localeCompare
const localeCompareTemplates = generateMockTemplates(TEMPLATE_COUNT);
let totalLocaleCompareTime = 0;

console.log("Measuring Sorting (localeCompare)...");
for (let i = 0; i < ITERATIONS; i++) {
  const arr = [...localeCompareTemplates];
  const start = performance.now();
  arr.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  totalLocaleCompareTime += (performance.now() - start);
}

// 3. Optimized: String comparison with relational operators (> and <)
const stringCompareTemplates = generateMockTemplates(TEMPLATE_COUNT);
let totalStringCompareTime = 0;

console.log("Measuring Optimized Sorting (String operators > and <)...");
for (let i = 0; i < ITERATIONS; i++) {
  const arr = [...stringCompareTemplates];
  const start = performance.now();
  arr.sort((a, b) => {
    const dateA = a.created_at || "";
    const dateB = b.created_at || "";
    return dateB > dateA ? 1 : dateB < dateA ? -1 : 0;
  });
  totalStringCompareTime += (performance.now() - start);
}

const avgBaseline = totalBaselineTime / ITERATIONS;
const avgLocaleCompare = totalLocaleCompareTime / ITERATIONS;
const avgStringCompare = totalStringCompareTime / ITERATIONS;

console.log("\n📊 Results:");
console.log(`- Baseline Avg Time:       ${avgBaseline.toFixed(4)} ms`);
console.log(`- localeCompare Avg Time:   ${avgLocaleCompare.toFixed(4)} ms`);
console.log(`- String Operators Avg Time: ${avgStringCompare.toFixed(4)} ms`);
console.log(`\nSpeedups:`);
console.log(`- localeCompare:           ${(avgBaseline / avgLocaleCompare).toFixed(2)}x faster`);
console.log(`- String Operators:         ${(avgBaseline / avgStringCompare).toFixed(2)}x faster`);
console.log(`- String Operators vs localeCompare: ${(avgLocaleCompare / avgStringCompare).toFixed(2)}x faster`);

console.log("\n✅ Benchmarking completed successfully!");
