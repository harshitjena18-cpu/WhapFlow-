/**
 * scripts/verify_templates_sort_opt.ts
 *
 * Verifies that direct string comparison for sorting ISO 8601 timestamps
 * produces identical results to new Date().getTime() while running measurably faster.
 */

interface TemplateItem {
  id: string;
  created_at: string;
}

function generateMockTemplates(count: number): TemplateItem[] {
  const baseTime = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: `template-${i}`,
    // Generate random timestamps within the last 30 days
    created_at: new Date(baseTime - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString()
  }));
}

function sortWithDate(items: TemplateItem[]): TemplateItem[] {
  return [...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function sortWithString(items: TemplateItem[]): TemplateItem[] {
  return [...items].sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));
}

function verifyOptimization() {
  console.log("⚡ Verifying Template Sort Optimization...");
  const sampleCount = 100;
  const mockTemplates = generateMockTemplates(sampleCount);

  const sortedDate = sortWithDate(mockTemplates);
  const sortedString = sortWithString(mockTemplates);

  // 1. Correctness Verification
  let isCorrect = true;
  for (let i = 0; i < sampleCount; i++) {
    if (sortedDate[i].id !== sortedString[i].id) {
      isCorrect = false;
      console.error(`Mismatch at index ${i}: Date=${sortedDate[i].id}, String=${sortedString[i].id}`);
      break;
    }
  }

  if (isCorrect) {
    console.log("✅ Correctness check PASSED: String comparison produces identical sort order to Date comparison.");
  } else {
    console.error("❌ Correctness check FAILED!");
    process.exit(1);
  }

  // 2. Performance Benchmark
  const iterations = 500;
  const largeSet = generateMockTemplates(1000);

  console.log(`\n📊 Running benchmark (${iterations} iterations on 1,000 items)...`);

  const startDate = performance.now();
  for (let i = 0; i < iterations; i++) {
    sortWithDate(largeSet);
  }
  const dateDuration = performance.now() - startDate;

  const startString = performance.now();
  for (let i = 0; i < iterations; i++) {
    sortWithString(largeSet);
  }
  const stringDuration = performance.now() - startString;

  const speedup = dateDuration / stringDuration;

  console.log(`Date parse sort time:   ${dateDuration.toFixed(2)} ms`);
  console.log(`String compare sort time: ${stringDuration.toFixed(2)} ms`);
  console.log(`Speedup:                  ${speedup.toFixed(2)}x faster`);

  if (speedup > 1.5) {
    console.log("✅ Performance benchmark PASSED: Significant speedup achieved!");
  } else {
    console.warn("⚠️ Performance gain was lower than expected, but correct.");
  }
}

verifyOptimization();
