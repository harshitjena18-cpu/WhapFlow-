// scripts/verify_template_sort_perf.ts

interface TemplateItem {
  id: string;
  template_name: string;
  created_at: string;
}

console.log("⚡ Starting verification of template ISO 8601 date string sorting...");

// 1. Generate test data with ISO 8601 date strings
const sampleDates = [
  "2026-03-01T12:00:00.000Z",
  "2026-03-05T08:30:00.000Z",
  "2026-01-15T18:45:00.000Z",
  "2026-03-05T08:30:00.001Z",
  "2025-12-31T23:59:59.999Z",
  "2026-02-28T10:00:00.000Z",
];

const mockTemplates: TemplateItem[] = sampleDates.map((dateStr, index) => ({
  id: `tpl-${index + 1}`,
  template_name: `template_${index + 1}`,
  created_at: dateStr,
}));

// Baseline sort: Date object parsing
const baselineSorted = [...mockTemplates].sort(
  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
);

// Optimized sort: Direct ISO string comparison
const optimizedSorted = [...mockTemplates].sort((a, b) =>
  b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0
);

// 2. Verify equivalence of sorted output
const isIdentical = baselineSorted.every(
  (item, idx) => item.id === optimizedSorted[idx].id
);

if (!isIdentical) {
  console.error("❌ Mismatch detected between Date parsing sort and String comparison sort!");
  console.error("Baseline:", baselineSorted.map((t) => t.created_at));
  console.error("Optimized:", optimizedSorted.map((t) => t.created_at));
  process.exit(1);
} else {
  console.log("✅ Equivalence check PASSED: String comparison sort produces identical order to Date parsing sort.");
}

// 3. Performance Benchmark (N=1000 items, 1000 iterations)
const benchmarkItems: TemplateItem[] = Array.from({ length: 1000 }, (_, i) => ({
  id: `tpl-${i}`,
  template_name: `template_${i}`,
  created_at: new Date(1700000000000 + i * 360000).toISOString(),
}));

const ITERATIONS = 500;

const startBaseline = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  const arr = [...benchmarkItems];
  arr.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
const endBaseline = performance.now();
const baselineTime = endBaseline - startBaseline;

const startOptimized = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  const arr = [...benchmarkItems];
  arr.sort((a, b) =>
    b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0
  );
}
const endOptimized = performance.now();
const optimizedTime = endOptimized - startOptimized;

const speedup = baselineTime / Math.max(optimizedTime, 0.001);

console.log("\n--- Benchmark Results ---");
console.log(`Baseline (Date parsing sort): ${baselineTime.toFixed(2)}ms`);
console.log(`Optimized (String comparison): ${optimizedTime.toFixed(2)}ms`);
console.log(`Speedup: ${speedup.toFixed(2)}x faster`);

console.log("\n✅ All template sort verification and performance checks completed successfully!");
