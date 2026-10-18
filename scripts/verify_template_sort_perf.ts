// scripts/verify_template_sort_perf.ts

interface Template {
  id: string;
  template_name: string;
  created_at: string;
}

const N = 1000;
const templates: Template[] = Array.from({ length: N }, (_, i) => {
  const d = new Date(Date.now() - Math.floor(Math.random() * 10000000000));
  return {
    id: `tpl_${i}`,
    template_name: `Template ${i}`,
    created_at: d.toISOString(),
  };
});

console.log(`Benchmarking array sort with ${N} ISO date strings...`);

// Test 1: new Date().getTime()
const list1 = [...templates];
const start1 = performance.now();
for (let iter = 0; iter < 100; iter++) {
  const copy = [...list1];
  copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
const end1 = performance.now();
const timeDate = end1 - start1;

// Test 2: Direct string comparison
const list2 = [...templates];
const start2 = performance.now();
for (let iter = 0; iter < 100; iter++) {
  const copy = [...list2];
  copy.sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));
}
const end2 = performance.now();
const timeString = end2 - start2;

console.log(`new Date().getTime() sort time (100 iterations): ${timeDate.toFixed(2)} ms`);
console.log(`Direct string comparison sort time (100 iterations): ${timeString.toFixed(2)} ms`);
console.log(`Speedup: ${(timeDate / timeString).toFixed(2)}x faster`);

// Verify ordering produces identical results
const sortedDate = [...templates].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
const sortedString = [...templates].sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));

let match = true;
for (let i = 0; i < N; i++) {
  if (sortedDate[i].id !== sortedString[i].id) {
    match = false;
    break;
  }
}

if (match) {
  console.log("✅ Verification passed: Direct string comparison produces identical sort results!");
} else {
  throw new Error("Verification failed: Sort results differ!");
}
