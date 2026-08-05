/**
 * scripts/benchmark_template_sorting.ts
 *
 * Benchmarks the performance of sorting templates by ISO-8601 created_at dates:
 * - Baseline: Parsing Date objects inside the sort comparison function.
 * - Optimized: Direct string comparison using relational operators with fallback values.
 */

interface SimpleTemplate {
  id: string;
  created_at: string;
}

function generateMockTemplates(count: number): SimpleTemplate[] {
  const templates: SimpleTemplate[] = [];
  const baseTime = new Date("2026-01-01T00:00:00.000Z").getTime();

  for (let i = 0; i < count; i++) {
    // Generate dates in arbitrary/random order
    const randomOffset = Math.floor(Math.random() * count * 1000 * 60);
    const dateStr = new Date(baseTime + randomOffset).toISOString();
    templates.push({
      id: `tmpl-${i}`,
      created_at: dateStr
    });
  }
  return templates;
}

function sortBaseline(templates: SimpleTemplate[]) {
  return [...templates].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function sortOptimized(templates: SimpleTemplate[]) {
  return [...templates].sort((a, b) => {
    const dateA = a.created_at || "";
    const dateB = b.created_at || "";
    return dateB > dateA ? 1 : dateB < dateA ? -1 : 0;
  });
}

function runBenchmark() {
  const N = 1000;
  const RUNS = 1000;
  const templates = generateMockTemplates(N);

  console.log(`⚡ Template Sorting Benchmark (N = ${N}, Runs = ${RUNS})`);

  // Verify correctness first
  const sortedBaseline = sortBaseline(templates);
  const sortedOptimized = sortOptimized(templates);

  const baselineIds = sortedBaseline.map(t => t.id).join(",");
  const optimizedIds = sortedOptimized.map(t => t.id).join(",");

  if (baselineIds !== optimizedIds) {
    console.error("❌ ERROR: Sorting results are not identical!");
    // Log the first few mismatching elements
    for (let i = 0; i < N; i++) {
      if (sortedBaseline[i].id !== sortedOptimized[i].id) {
        console.error(`Mismatch at index ${i}:`);
        console.error(`  Baseline:  ${JSON.stringify(sortedBaseline[i])}`);
        console.error(`  Optimized: ${JSON.stringify(sortedOptimized[i])}`);
        break;
      }
    }
    Deno.exit(1);
  } else {
    console.log("✅ Functional Verification Passed: Both sort outputs are identical.");
  }

  // Measure Baseline
  const startBaseline = performance.now();
  for (let r = 0; r < RUNS; r++) {
    sortBaseline(templates);
  }
  const durationBaseline = performance.now() - startBaseline;

  // Measure Optimized
  const startOptimized = performance.now();
  for (let r = 0; r < RUNS; r++) {
    sortOptimized(templates);
  }
  const durationOptimized = performance.now() - startOptimized;

  const speedup = durationBaseline / durationOptimized;

  console.log(`\n--- Results ---`);
  console.log(`Baseline (Date parsing): ${durationBaseline.toFixed(2)}ms`);
  console.log(`Optimized (String comp): ${durationOptimized.toFixed(2)}ms`);
  console.log(`Speedup:                 ${speedup.toFixed(2)}x faster`);
  console.log(`Latency Reduction:       ${(durationBaseline - durationOptimized).toFixed(2)}ms`);
}

runBenchmark();
