import { AutomationTemplate } from "../src/supabase/functions/server/types.ts";

function sortLegacy(templates: AutomationTemplate[]) {
  return templates.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function sortOptimized(templates: AutomationTemplate[]) {
  return templates.sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));
}

// 1. Correctness Test
const mockTemplates: AutomationTemplate[] = [
  { id: "1", template_name: "T1", display_name: "T1", delay_minutes: 30, content: "c1", created_at: "2026-01-15T10:00:00.000Z" },
  { id: "2", template_name: "T2", display_name: "T2", delay_minutes: 30, content: "c2", created_at: "2026-03-22T14:30:00.000Z" },
  { id: "3", template_name: "T3", display_name: "T3", delay_minutes: 30, content: "c3", created_at: "2025-12-01T08:15:00.000Z" },
  { id: "4", template_name: "T4", display_name: "T4", delay_minutes: 30, content: "c4", created_at: "2026-03-22T14:30:00.000Z" }, // duplicate timestamp
];

const legacyOrder = sortLegacy([...mockTemplates]).map(t => t.id);
const optOrder = sortOptimized([...mockTemplates]).map(t => t.id);

console.log("Legacy Order:   ", legacyOrder);
console.log("Optimized Order:", optOrder);

if (JSON.stringify(legacyOrder) !== JSON.stringify(optOrder)) {
  console.error("❌ Mismatch in sorting order!");
  process.exit(1);
} else {
  console.log("✅ Correctness check passed: Sort orders are identical.");
}

// 2. Performance Benchmark
const largeDataset: AutomationTemplate[] = Array.from({ length: 500 }, (_, i) => ({
  id: `id_${i}`,
  template_name: `t_${i}`,
  display_name: `Template ${i}`,
  delay_minutes: 30,
  content: "sample content",
  created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
}));

const ITERATIONS = 1000;

const startLegacy = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  sortLegacy([...largeDataset]);
}
const endLegacy = performance.now();
const legacyTime = endLegacy - startLegacy;

const startOpt = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  sortOptimized([...largeDataset]);
}
const endOpt = performance.now();
const optTime = endOpt - startOpt;

console.log(`\n📊 Performance Results (${ITERATIONS} iterations on 500 items):`);
console.log(`- Legacy (new Date().getTime()): ${legacyTime.toFixed(2)}ms`);
console.log(`- Optimized (Direct String Compare): ${optTime.toFixed(2)}ms`);
console.log(`- Speedup: ${(legacyTime / optTime).toFixed(2)}x faster`);
