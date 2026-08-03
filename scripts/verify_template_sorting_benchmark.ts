// scripts/verify_template_sorting_benchmark.ts

interface MockTemplate {
  id: string;
  created_at: string;
}

// Generate large list of mock templates with random ISO-8601 timestamps
function generateMockTemplates(count: number): MockTemplate[] {
  const templates: MockTemplate[] = [];
  const baseTime = Date.now();
  for (let i = 0; i < count; i++) {
    // Generate dates ranging over several days, some identical, some different
    const randomOffset = Math.floor(Math.random() * 10000000);
    const dateStr = new Date(baseTime - randomOffset).toISOString();
    templates.push({
      id: `template_${i}`,
      created_at: dateStr
    });
  }
  return templates;
}

async function runBenchmark() {
  const count = 5000;
  const iterations = 50;
  console.log(`🚀 Starting Template Sorting Benchmark with ${count} items, ${iterations} iterations...`);

  const mockTemplates = generateMockTemplates(count);

  // 1. Measure Baseline Date parsing sort
  console.log("\n⌛ Measuring Baseline (Date object parsing in sorting loop)...");
  let baselineTotalTime = 0;
  let lastBaselineOrder: string[] = [];

  for (let iter = 0; iter < iterations; iter++) {
    // Make a shallow copy to sort in-place
    const templatesCopy = [...mockTemplates];
    const start = performance.now();
    templatesCopy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const end = performance.now();
    baselineTotalTime += (end - start);
    if (iter === iterations - 1) {
      lastBaselineOrder = templatesCopy.map(t => t.id);
    }
  }
  const avgBaselineTime = baselineTotalTime / iterations;
  console.log(`- Average baseline sort time: ${avgBaselineTime.toFixed(4)}ms`);

  // 2. Measure Optimized direct string sort
  console.log("\n⌛ Measuring Optimized (Direct lexicographical string comparison)...");
  let optimizedTotalTime = 0;
  let lastOptimizedOrder: string[] = [];

  for (let iter = 0; iter < iterations; iter++) {
    const templatesCopy = [...mockTemplates];
    const start = performance.now();
    templatesCopy.sort((a, b) => {
      const dateA = a.created_at || "";
      const dateB = b.created_at || "";
      return dateB > dateA ? 1 : dateB < dateA ? -1 : 0;
    });
    const end = performance.now();
    optimizedTotalTime += (end - start);
    if (iter === iterations - 1) {
      lastOptimizedOrder = templatesCopy.map(t => t.id);
    }
  }
  const avgOptimizedTime = optimizedTotalTime / iterations;
  console.log(`- Average optimized sort time: ${avgOptimizedTime.toFixed(4)}ms`);

  // 3. Verification: Ensure results are identical
  let ordersMatch = true;
  if (lastBaselineOrder.length !== lastOptimizedOrder.length) {
    ordersMatch = false;
  } else {
    for (let i = 0; i < lastBaselineOrder.length; i++) {
      if (lastBaselineOrder[i] !== lastOptimizedOrder[i]) {
        ordersMatch = false;
        break;
      }
    }
  }

  console.log("\n--- Verification ---");
  if (ordersMatch) {
    console.log("✅ PASS: Both sorting methods produced the EXACT SAME order!");
  } else {
    console.error("❌ FAIL: Sorting orders do not match!");
    process.exit(1);
  }

  // Calculate speedup
  const speedup = avgBaselineTime / avgOptimizedTime;
  console.log(`📈 Speedup: ${speedup.toFixed(2)}x faster`);
  console.log(`⚡ Saved ~${(avgBaselineTime - avgOptimizedTime).toFixed(4)}ms per sorting operation`);
}

runBenchmark().catch(console.error);
