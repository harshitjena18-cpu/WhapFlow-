// Benchmark comparing Date parsing vs direct ISO string comparison for template sorting

const SAMPLE_SIZE = 1000;
const RUNS = 1000;

interface TemplateSample {
  id: string;
  created_at: string;
}

const templates: TemplateSample[] = Array.from({ length: SAMPLE_SIZE }, (_, i) => ({
  id: `tmpl_${i}`,
  created_at: new Date(Date.now() - Math.floor(Math.random() * 10_000_000_000)).toISOString(),
}));

console.log(`⚡ Benchmark Template Sorting: Array size = ${SAMPLE_SIZE}, Iterations = ${RUNS}`);

// 1. Unoptimized: Date object parsing
const startUnoptimized = performance.now();
for (let r = 0; r < RUNS; r++) {
  const arr = [...templates];
  arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
const timeUnoptimized = performance.now() - startUnoptimized;

// 2. Optimized: Direct ISO-8601 string comparison
const startOptimized = performance.now();
for (let r = 0; r < RUNS; r++) {
  const arr = [...templates];
  arr.sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));
}
const timeOptimized = performance.now() - startOptimized;

const speedup = (timeUnoptimized / timeOptimized).toFixed(2);

console.log(`- Baseline (Date parsing): ${timeUnoptimized.toFixed(2)}ms`);
console.log(`- Optimized (String comparison): ${timeOptimized.toFixed(2)}ms`);
console.log(`- Speedup: ${speedup}x faster`);
