// scripts/benchmark_template_sorting.ts
import { performance } from "node:perf_hooks";

interface MockTemplate {
  id: string;
  template_name: string;
  display_name: string;
  created_at: string;
}

function generateMockTemplates(count: number): MockTemplate[] {
  const templates: MockTemplate[] = [];
  const baseTime = Date.now();
  for (let i = 0; i < count; i++) {
    // Generate dates with some random order
    const randomOffset = Math.floor(Math.random() * 1000000000);
    const createdDate = new Date(baseTime - randomOffset).toISOString();
    templates.push({
      id: `id-${i}`,
      template_name: `template_${i}`,
      display_name: `Template ${i}`,
      created_at: createdDate,
    });
  }
  return templates;
}

function runBenchmark() {
  const count = 200;
  const iterations = 5000;
  const mockTemplates = generateMockTemplates(count);

  console.log("⚡ Starting Template Sorting Performance Benchmark...");
  console.log(`- Template count: ${count}`);
  console.log(`- Sorting iterations: ${iterations}`);

  // 1. Legacy/Baseline: new Date() parsing
  const baselineStart = performance.now();
  for (let iter = 0; iter < iterations; iter++) {
    const list = [...mockTemplates];
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  const baselineEnd = performance.now();
  const baselineTime = baselineEnd - baselineStart;

  // 2. Optimized: Direct ISO string comparison
  const optimizedStart = performance.now();
  for (let iter = 0; iter < iterations; iter++) {
    const list = [...mockTemplates];
    list.sort((a, b) => {
      const dateA = a.created_at || "";
      const dateB = b.created_at || "";
      return dateB < dateA ? -1 : dateB > dateA ? 1 : 0;
    });
  }
  const optimizedEnd = performance.now();
  const optimizedTime = optimizedEnd - optimizedStart;

  // Sanity Check: Confirm both methods yield the same sorted output
  const list1 = [...mockTemplates];
  list1.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const list2 = [...mockTemplates];
  list2.sort((a, b) => {
    const dateA = a.created_at || "";
    const dateB = b.created_at || "";
    return dateB < dateA ? -1 : dateB > dateA ? 1 : 0;
  });

  const correct = JSON.stringify(list1.map(t => t.id)) === JSON.stringify(list2.map(t => t.id));

  console.log("\n--- Results ---");
  console.log(`Baseline (new Date().getTime()): ${baselineTime.toFixed(2)} ms`);
  console.log(`Optimized (Lexicographical Str): ${optimizedTime.toFixed(2)} ms`);
  console.log(`Speedup Factor:                 ${(baselineTime / optimizedTime).toFixed(2)}x`);
  console.log(`Latency Reduction:              ${((1 - optimizedTime / baselineTime) * 100).toFixed(2)}%`);
  console.log(`Sorting Outputs Identical:      ${correct ? "Yes (Pass) ✅" : "No (Fail) ❌"}`);
}

runBenchmark();
