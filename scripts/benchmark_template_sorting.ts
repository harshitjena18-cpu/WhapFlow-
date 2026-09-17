import { performance } from 'perf_hooks';

// Generate mock templates with ISO 8601 created_at timestamps
function generateMockTemplates(count: number) {
  const templates = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    // Random timestamps within the last 30 days
    const randomOffset = Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
    const date = new Date(now - randomOffset).toISOString();
    templates.push({
      id: `template-${i}`,
      template_name: `Template ${i}`,
      created_at: date
    });
  }
  return templates;
}

const N = 1000;
const ITERATIONS = 1000;
const templatesMaster = generateMockTemplates(N);

// Baseline: Date parsing sorting
let totalDateSortTime = 0;
for (let iter = 0; iter < ITERATIONS; iter++) {
  const templates = [...templatesMaster];
  const start = performance.now();
  templates.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  totalDateSortTime += (performance.now() - start);
}

// Optimized: Direct string comparison sorting
let totalStringSortTime = 0;
for (let iter = 0; iter < ITERATIONS; iter++) {
  const templates = [...templatesMaster];
  const start = performance.now();
  templates.sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));
  totalStringSortTime += (performance.now() - start);
}

console.log(`Array size: ${N}, Iterations: ${ITERATIONS}`);
console.log(`Baseline (Date parsing sort): ${totalDateSortTime.toFixed(2)} ms`);
console.log(`Optimized (String comparison sort): ${totalStringSortTime.toFixed(2)} ms`);
console.log(`Speedup: ${(totalDateSortTime / totalStringSortTime).toFixed(2)}x faster`);
