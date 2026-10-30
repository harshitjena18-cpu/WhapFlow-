// scripts/verify_template_sort_perf.ts

const templates = Array.from({ length: 500 }, (_, i) => ({
  id: `id_${i}`,
  template_name: `template_${i}`,
  created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
}));

function benchmark() {
  const iterations = 5000;

  // Baseline: new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  const listBaseline = templates.map(t => ({ ...t }));
  const startBaseline = performance.now();
  for (let i = 0; i < iterations; i++) {
    const copy = [...listBaseline];
    copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  const endBaseline = performance.now();
  const baselineTime = endBaseline - startBaseline;

  // Optimized: direct string comparison b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0
  const listOptimized = templates.map(t => ({ ...t }));
  const startOptimized = performance.now();
  for (let i = 0; i < iterations; i++) {
    const copy = [...listOptimized];
    copy.sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));
  }
  const endOptimized = performance.now();
  const optimizedTime = endOptimized - startOptimized;

  // Verification: Verify sort results are identical
  const sortedBaseline = [...listBaseline].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const sortedOptimized = [...listOptimized].sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));

  const isIdentical = sortedBaseline.every((item, idx) => item.id === sortedOptimized[idx].id);

  console.log("=== Template ISO Date Sorting Performance Benchmark ===");
  console.log(`Array Size: 500 templates, Iterations: ${iterations}`);
  console.log(`Baseline (new Date().getTime()): ${baselineTime.toFixed(2)}ms`);
  console.log(`Optimized (Direct string compare): ${optimizedTime.toFixed(2)}ms`);
  console.log(`Speedup: ${(baselineTime / optimizedTime).toFixed(2)}x faster`);
  console.log(`Sort Equivalence Verified: ${isIdentical}`);
}

benchmark();
