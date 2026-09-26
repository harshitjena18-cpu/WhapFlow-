import { performance } from 'node:perf_hooks';

// Benchmark comparison between Date parsing sort and string comparison sort for ISO 8601 strings
const templatesCount = 1000;
const templates = Array.from({ length: templatesCount }, (_, i) => ({
  id: `id-${i}`,
  created_at: new Date(1700000000000 + Math.floor(Math.random() * 10000000000)).toISOString()
}));

// Test 1: Date parsing sort
const arr1 = [...templates];
const start1 = performance.now();
for (let run = 0; run < 500; run++) {
  const copy = [...arr1];
  copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
const time1 = performance.now() - start1;

// Test 2: Direct string comparison sort
const arr2 = [...templates];
const start2 = performance.now();
for (let run = 0; run < 500; run++) {
  const copy = [...arr2];
  copy.sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));
}
const time2 = performance.now() - start2;

console.log(`Date parsing sort: ${time1.toFixed(2)}ms`);
console.log(`String comparison sort: ${time2.toFixed(2)}ms`);
console.log(`Speedup: ${(time1 / time2).toFixed(2)}x faster`);

// Verify exact equivalence of sort output
const sorted1 = [...templates].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
const sorted2 = [...templates].sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));
const isEqual = sorted1.every((item, idx) => item.id === sorted2[idx].id);
console.log(`Sort results identical: ${isEqual}`);
