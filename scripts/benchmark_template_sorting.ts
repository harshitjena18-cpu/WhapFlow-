/**
 * scripts/benchmark_template_sorting.ts
 *
 * Benchmarks ISO-8601 template sorting logic:
 * Baseline: new Date(x.created_at).getTime()
 * Optimized: direct lexicographical string comparison
 */

interface MockTemplate {
  id: string;
  created_at: string;
}

// Generate 1000 mock templates with random ISO-8601 dates over the last year
const generateMockTemplates = (count: number): MockTemplate[] => {
  const templates: MockTemplate[] = [];
  const baseTime = Date.now();
  for (let i = 0; i < count; i++) {
    const randomOffset = Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000);
    const date = new Date(baseTime - randomOffset);
    templates.push({
      id: `template-${i}`,
      created_at: date.toISOString()
    });
  }
  return templates;
};

function runSortingBaseline(arr: MockTemplate[]): MockTemplate[] {
  const copy = [...arr];
  copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return copy;
}

function runSortingOptimized(arr: MockTemplate[]): MockTemplate[] {
  const copy = [...arr];
  copy.sort((a, b) => {
    const dateA = a.created_at || '';
    const dateB = b.created_at || '';
    return dateB > dateA ? 1 : dateB < dateA ? -1 : 0;
  });
  return copy;
}

async function runBenchmark() {
  const LIST_SIZE = 1000;
  const ITERATIONS = 1000;

  console.log(`⚡ ISO-8601 Date Sorting Benchmark`);
  console.log(`List Size: ${LIST_SIZE} elements`);
  console.log(`Iterations: ${ITERATIONS} sorts\n`);

  const mockList = generateMockTemplates(LIST_SIZE);

  // Warm-up
  runSortingBaseline(mockList);
  runSortingOptimized(mockList);

  // 1. Measure Baseline
  console.log("Measuring Baseline (Date parsing)...");
  const startBaseline = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    runSortingBaseline(mockList);
  }
  const endBaseline = performance.now();
  const baselineTime = endBaseline - startBaseline;
  console.log(`  - Baseline (Date parsing) Total Time: ${baselineTime.toFixed(2)}ms`);
  console.log(`  - Average per sort: ${(baselineTime / ITERATIONS).toFixed(4)}ms`);

  // 2. Measure Optimized
  console.log("Measuring Optimized (Lexicographical String Comparison)...");
  const startOptimized = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    runSortingOptimized(mockList);
  }
  const endOptimized = performance.now();
  const optimizedTime = endOptimized - startOptimized;
  console.log(`  - Optimized (String comparison) Total Time: ${optimizedTime.toFixed(2)}ms`);
  console.log(`  - Average per sort: ${(optimizedTime / ITERATIONS).toFixed(4)}ms`);

  // 3. Comparison & Correctness check
  const sortedBaseline = runSortingBaseline(mockList);
  const sortedOptimized = runSortingOptimized(mockList);

  let isIdentical = true;
  for (let i = 0; i < LIST_SIZE; i++) {
    if (sortedBaseline[i].id !== sortedOptimized[i].id) {
      isIdentical = false;
      break;
    }
  }

  console.log("\n--- Verification ---");
  console.log(`Sorting Output Correctness Check: ${isIdentical ? "✅ IDENTICAL (PASSED)" : "❌ DIFFERENT (FAILED)"}`);
  console.log(`Speedup: ${(baselineTime / optimizedTime).toFixed(2)}x faster`);
}

runBenchmark().catch(console.error);
