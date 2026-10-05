import { performance } from "node:perf_hooks";

interface Template {
  id: string;
  created_at: string;
}

// Verification 1: Verify exact sorting behavior match between legacy and optimized sort
const mockData: Template[] = [
  { id: "1", created_at: "2026-03-01T10:00:00.000Z" },
  { id: "2", created_at: "2026-03-05T12:00:00.000Z" },
  { id: "3", created_at: "2026-01-15T08:30:00.000Z" },
  { id: "4", created_at: "2026-03-05T12:00:00.000Z" }, // Duplicate timestamp edge case
  { id: "5", created_at: "2025-12-31T23:59:59.999Z" }
];

const legacySorted = [...mockData].sort(
  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
);

const optimizedSorted = [...mockData].sort(
  (a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0)
);

const isMatch = JSON.stringify(legacySorted.map((t) => t.id)) === JSON.stringify(optimizedSorted.map((t) => t.id));

if (!isMatch) {
  console.error("❌ Sort order mismatch between legacy and optimized implementation!");
  console.error("Legacy:", legacySorted);
  console.error("Optimized:", optimizedSorted);
  process.exit(1);
}

console.log("✅ Verification passed: Direct string sorting produces identical result to Date.getTime() sorting.");

// Benchmark: Measure execution time difference across 10,000 iterations for 50 templates
const numTemplates = 50;
const iterations = 10000;

const benchmarkTemplates: Template[] = Array.from({ length: numTemplates }, (_, i) => ({
  id: `id-${i}`,
  created_at: new Date(1700000000000 + Math.floor(Math.random() * 10000000000)).toISOString()
}));

const startLegacy = performance.now();
for (let i = 0; i < iterations; i++) {
  const arr = [...benchmarkTemplates];
  arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
const legacyTime = performance.now() - startLegacy;

const startOptimized = performance.now();
for (let i = 0; i < iterations; i++) {
  const arr = [...benchmarkTemplates];
  arr.sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));
}
const optimizedTime = performance.now() - startOptimized;

const speedup = legacyTime / optimizedTime;

console.log(`Legacy Date parsing sort time: ${legacyTime.toFixed(2)} ms`);
console.log(`Optimized string comparison sort time: ${optimizedTime.toFixed(2)} ms`);
console.log(`Speedup factor: ${speedup.toFixed(2)}x`);

if (speedup < 2.0) {
  console.error("❌ Optimization did not achieve expected speedup threshold!");
  process.exit(1);
}

console.log("✅ Performance benchmark verification passed!");
