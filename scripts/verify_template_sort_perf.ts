import assert from "node:assert";

interface AutomationTemplate {
  id: string;
  template_name: string;
  display_name: string;
  delay_minutes: number;
  content?: string;
  enabled: boolean;
  created_at: string;
}

console.log("⚡ Starting verification and benchmark for Template Sort Optimization...");

// 1. Correctness Verification
const sampleTemplates: AutomationTemplate[] = [
  {
    id: "1",
    template_name: "t1",
    display_name: "T1",
    delay_minutes: 10,
    enabled: true,
    created_at: "2026-01-15T08:30:00.000Z",
  },
  {
    id: "2",
    template_name: "t2",
    display_name: "T2",
    delay_minutes: 20,
    enabled: false,
    created_at: "2026-03-20T14:45:00.000Z",
  },
  {
    id: "3",
    template_name: "t3",
    display_name: "T3",
    delay_minutes: 30,
    enabled: true,
    created_at: "2026-02-10T12:00:00.000Z",
  },
  {
    id: "4",
    template_name: "t4",
    display_name: "T4",
    delay_minutes: 15,
    enabled: true,
    created_at: "2026-03-20T14:45:00.000Z", // identical timestamp
  },
  {
    id: "5",
    template_name: "t5",
    display_name: "T5",
    delay_minutes: 25,
    enabled: false,
    created_at: "2025-12-31T23:59:59.999Z",
  },
];

const listDateSort = [...sampleTemplates].sort(
  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
);

const listStringSort = [...sampleTemplates].sort((a, b) =>
  b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0
);

console.log("\nVerifying equivalence between Date sort and string comparison sort...");
for (let i = 0; i < sampleTemplates.length; i++) {
  assert.strictEqual(
    listStringSort[i].created_at,
    listDateSort[i].created_at,
    `Mismatch at index ${i}`
  );
}
console.log("✅ Correctness confirmed: direct string comparison matches Date sort exactly.");

// 2. Performance Benchmark
const NUM_TEMPLATES = 50;
const ITERATIONS = 50000;

const mockTemplates: AutomationTemplate[] = Array.from({ length: NUM_TEMPLATES }, (_, i) => ({
  id: `id_${i}`,
  template_name: `template_${i}`,
  display_name: `Template ${i}`,
  delay_minutes: 30,
  enabled: i % 2 === 0,
  created_at: new Date(Date.now() - (i * 3600 * 1000 + (i % 7) * 13000)).toISOString(),
}));

console.log(`\nBenchmarking sort performance (${NUM_TEMPLATES} templates, ${ITERATIONS} iterations)...`);

// Warmup
for (let i = 0; i < 1000; i++) {
  [...mockTemplates].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  [...mockTemplates].sort((a, b) =>
    b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0
  );
}

// Baseline: Date instantiation in comparator
const startBaseline = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  const arr = [...mockTemplates];
  arr.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
const baselineDuration = performance.now() - startBaseline;

// Optimized: Direct string comparison
const startOptimized = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  const arr = [...mockTemplates];
  arr.sort((a, b) =>
    b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0
  );
}
const optimizedDuration = performance.now() - startOptimized;

const speedup = baselineDuration / optimizedDuration;
console.log(`Baseline (new Date().getTime()): ${baselineDuration.toFixed(2)}ms`);
console.log(`Optimized (direct string comp):   ${optimizedDuration.toFixed(2)}ms`);
console.log(`🚀 Speedup: ${speedup.toFixed(2)}x faster`);
console.log(`⏱️ Saved: ${(baselineDuration - optimizedDuration).toFixed(2)}ms over ${ITERATIONS} runs`);

assert(speedup > 2.0, "Expected at least 2x speedup from direct string comparison");
console.log("\n🎉 Verification and benchmark passed successfully!");
