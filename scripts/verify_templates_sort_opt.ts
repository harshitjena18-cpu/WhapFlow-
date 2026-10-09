import { performance } from 'perf_hooks';

interface AutomationTemplate {
  id: string;
  template_name: string;
  display_name: string;
  created_at: string;
}

console.log('--- Verifying Template Timestamp Sort Optimization ---');

// 1. Correctness Verification
const sampleTemplates: AutomationTemplate[] = [
  { id: '1', template_name: 't1', display_name: 'T1', created_at: '2025-01-15T12:00:00.000Z' },
  { id: '2', template_name: 't2', display_name: 'T2', created_at: '2025-03-20T08:30:15.500Z' },
  { id: '3', template_name: 't3', display_name: 'T3', created_at: '2024-12-01T00:00:00.000Z' },
  { id: '4', template_name: 't4', display_name: 'T4', created_at: '2025-03-20T08:30:15.501Z' },
  { id: '5', template_name: 't5', display_name: 'T5', created_at: '2025-02-10T19:45:00.123Z' },
];

const legacySorted = [...sampleTemplates].sort(
  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
);

const optimizedSorted = [...sampleTemplates].sort((a, b) =>
  b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0
);

let matches = true;
for (let i = 0; i < sampleTemplates.length; i++) {
  if (legacySorted[i].id !== optimizedSorted[i].id) {
    matches = false;
    console.error(`Mismatch at index ${i}: legacy=${legacySorted[i].id}, optimized=${optimizedSorted[i].id}`);
  }
}

if (!matches) {
  console.error('❌ Verification failed: Sort orders do not match!');
  process.exit(1);
}

console.log('✅ Success: Direct ISO string comparison produces identical sort order!');

// 2. Performance Benchmark
function generateMockTemplates(count: number): AutomationTemplate[] {
  const templates: AutomationTemplate[] = [];
  const baseTime = new Date('2025-01-01T00:00:00.000Z').getTime();
  for (let i = 0; i < count; i++) {
    const offset = Math.floor(Math.random() * 10000000000);
    const isoString = new Date(baseTime + offset).toISOString();
    templates.push({
      id: `id-${i}`,
      template_name: `template_${i}`,
      display_name: `Template ${i}`,
      created_at: isoString,
    });
  }
  return templates;
}

const ITERATIONS = 5000;
const TEMPLATE_COUNT = 50;
const testDataset = generateMockTemplates(TEMPLATE_COUNT);

// Baseline benchmark
const startLegacy = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  const arr = [...testDataset];
  arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
const endLegacy = performance.now();
const timeLegacy = endLegacy - startLegacy;

// Optimized benchmark
const startOptimized = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  const arr = [...testDataset];
  arr.sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));
}
const endOptimized = performance.now();
const timeOptimized = endOptimized - startOptimized;

const speedup = (timeLegacy / timeOptimized).toFixed(2);

console.log(`\n--- Performance Benchmark (${ITERATIONS} iterations on ${TEMPLATE_COUNT} items) ---`);
console.log(`Legacy Date.getTime() sort:  ${timeLegacy.toFixed(2)} ms`);
console.log(`Optimized Direct String sort: ${timeOptimized.toFixed(2)} ms`);
console.log(`Speedup:                      ${speedup}x faster`);

console.log('\n✅ All verification checks passed successfully!');
