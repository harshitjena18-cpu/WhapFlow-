// Benchmark script to compare template sorting methods:
// Method A: Array.sort with Date parsing: new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
// Method B: Array.sort with direct lexicographical string comparison: (b.created_at || '').localeCompare(a.created_at || '') or b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0

function generateTemplates(count: number) {
  const templates = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    templates.push({
      id: `id-${i}`,
      template_name: `template_${i}`,
      display_name: `Template ${i}`,
      created_at: new Date(now - Math.floor(Math.random() * 10000000000)).toISOString(),
    });
  }
  return templates;
}

const N_ITEMS = 100;
const ITERATIONS = 10000;

console.log(`Running template sorting benchmark (${N_ITEMS} items x ${ITERATIONS} iterations)...`);

// Benchmark Method A: Date parsing
const sampleA = generateTemplates(N_ITEMS);
const startA = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  const arr = [...sampleA];
  arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
const endA = performance.now();
const durationA = endA - startA;

// Benchmark Method B: Direct string comparison operator
const sampleB = generateTemplates(N_ITEMS);
const startB = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  const arr = [...sampleB];
  arr.sort((a, b) => {
    const dateA = a.created_at || '';
    const dateB = b.created_at || '';
    return dateB > dateA ? 1 : dateB < dateA ? -1 : 0;
  });
}
const endB = performance.now();
const durationB = endB - startB;

console.log(`Method A (Date parsing): ${durationA.toFixed(2)} ms`);
console.log(`Method B (Direct string comparison): ${durationB.toFixed(2)} ms`);
console.log(`Speedup: ${(durationA / durationB).toFixed(2)}x faster`);
