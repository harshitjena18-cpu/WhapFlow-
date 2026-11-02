// scripts/verify_template_sort_perf.ts

interface TemplateItem {
  id: string;
  template_name: string;
  created_at: string;
}

// Generate test dataset of ISO 8601 timestamps
const sampleSize = 200;
const templates: TemplateItem[] = Array.from({ length: sampleSize }, (_, i) => ({
  id: `tpl_${i}`,
  template_name: `Template ${i}`,
  // Spread out across varied times
  created_at: new Date(1700000000000 + (i * 3748291) % 10000000000).toISOString()
}));

// Legacy method: new Date().getTime() in comparator
function sortWithDateGetTime(list: TemplateItem[]): TemplateItem[] {
  return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// Optimized method: direct string comparison (ISO 8601 is lexicographically ordered)
function sortWithDirectString(list: TemplateItem[]): TemplateItem[] {
  return [...list].sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));
}

console.log("⚡ Bolt: Verifying template sort optimization...\n");

// 1. Correctness & Equivalence Verification
const sortedLegacy = sortWithDateGetTime(templates);
const sortedOptimized = sortWithDirectString(templates);

if (sortedLegacy.length !== sortedOptimized.length) {
  console.error("❌ Length mismatch!");
  process.exit(1);
}

for (let i = 0; i < sortedLegacy.length; i++) {
  if (sortedLegacy[i].id !== sortedOptimized[i].id || sortedLegacy[i].created_at !== sortedOptimized[i].created_at) {
    console.error(`❌ Mismatch at index ${i}:`, {
      legacy: sortedLegacy[i],
      optimized: sortedOptimized[i]
    });
    process.exit(1);
  }
}

console.log(`✅ Correctness Verified: Both sort methods produced identical results across ${sampleSize} items.`);

// 2. Performance Benchmark
const iterations = 1000;

const startLegacy = performance.now();
for (let i = 0; i < iterations; i++) {
  sortWithDateGetTime(templates);
}
const legacyTime = performance.now() - startLegacy;

const startOptimized = performance.now();
for (let i = 0; i < iterations; i++) {
  sortWithDirectString(templates);
}
const optimizedTime = performance.now() - startOptimized;

const speedup = (legacyTime / optimizedTime).toFixed(2);
console.log(`\n📊 Benchmark Results (${iterations} iterations of ${sampleSize} items):`);
console.log(`  - Legacy (new Date().getTime()): ${legacyTime.toFixed(2)}ms`);
console.log(`  - Optimized (direct string sort): ${optimizedTime.toFixed(2)}ms`);
console.log(`  - Speedup: ${speedup}x faster`);
console.log(`  - Latency reduction: ${(legacyTime - optimizedTime).toFixed(2)}ms`);

if (Number(speedup) < 1.5) {
  console.warn("⚠️ Warning: Optimization didn't yield expected speedup in this environment.");
} else {
  console.log("\n🚀 Optimization verified: Significant performance boost achieved!");
}
