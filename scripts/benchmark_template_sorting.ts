// scripts/benchmark_template_sorting.ts

// Generate 5000 templates with random ISO-8601 dates over the past year
const NUM_TEMPLATES = 5000;
const mockTemplates = Array.from({ length: NUM_TEMPLATES }, (_, i) => {
  const randomDaysAgo = Math.random() * 365;
  const dateStr = new Date(Date.now() - randomDaysAgo * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: `template_${i}`,
    template_name: `Template ${i}`,
    created_at: dateStr,
  };
});

function benchmarkBaseline(iterations: number) {
  let totalTime = 0;
  for (let iter = 0; iter < iterations; iter++) {
    const list = [...mockTemplates];
    const start = performance.now();
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    totalTime += performance.now() - start;
  }
  return totalTime / iterations;
}

function benchmarkOptimized(iterations: number) {
  let totalTime = 0;
  for (let iter = 0; iter < iterations; iter++) {
    const list = [...mockTemplates];
    const start = performance.now();
    list.sort((a, b) => {
      const dateA = a.created_at || '';
      const dateB = b.created_at || '';
      return dateA > dateB ? -1 : dateA < dateB ? 1 : 0;
    });
    totalTime += performance.now() - start;
  }
  return totalTime / iterations;
}

console.log(`Running sorting benchmarks with ${NUM_TEMPLATES} items...`);
const ITERATIONS = 30;

// Warm up the runtime
benchmarkBaseline(5);
benchmarkOptimized(5);

const avgBaseline = benchmarkBaseline(ITERATIONS);
console.log(`[BASELINE]  Average sorting time (new Date):   ${avgBaseline.toFixed(4)} ms`);

const avgOptimized = benchmarkOptimized(ITERATIONS);
console.log(`[OPTIMIZED] Average sorting time (String compare): ${avgOptimized.toFixed(4)} ms`);

const speedup = avgBaseline / avgOptimized;
console.log(`\n⚡ Speedup: ${speedup.toFixed(2)}x faster!`);
console.log(`Reduction in latency: ${((avgBaseline - avgOptimized) / avgBaseline * 100).toFixed(2)}%`);
