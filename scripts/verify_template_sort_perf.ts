import { AutomationTemplate } from "../src/supabase/functions/server/types.ts";

function generateMockTemplates(count: number): AutomationTemplate[] {
  const templates: AutomationTemplate[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    // Generate dates within past 30 days ISO strings
    const randomTime = now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
    templates.push({
      id: `tmpl-${i}`,
      template_name: `Template ${i}`,
      display_name: `Display ${i}`,
      delay_minutes: 30,
      content: "Hello {{customer_name}}",
      generated_by_ai: false,
      ai_tone: null,
      enabled: i % 2 === 0,
      created_at: new Date(randomTime).toISOString()
    });
  }
  return templates;
}

function sortLegacy(templates: AutomationTemplate[]) {
  return templates.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function sortOptimized(templates: AutomationTemplate[]) {
  return templates.sort((a, b) => b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0);
}

// 1. Equivalence Check
const sample = generateMockTemplates(50);
const sampleLegacy = sortLegacy([...sample]);
const sampleOpt = sortOptimized([...sample]);

const isEquivalent = sampleLegacy.every((item, idx) => item.id === sampleOpt[idx].id);
console.log(`Equivalence Test Passed: ${isEquivalent}`);
if (!isEquivalent) {
  console.error("Mismatch found!");
  process.exit(1);
}

// 2. Performance Benchmark
const NUM_TEMPLATES = 1000;
const ITERATIONS = 1000;
const testData = generateMockTemplates(NUM_TEMPLATES);

// Legacy Benchmark
const startLegacy = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  sortLegacy([...testData]);
}
const legacyTime = performance.now() - startLegacy;

// Optimized Benchmark
const startOpt = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  sortOptimized([...testData]);
}
const optTime = performance.now() - startOpt;

console.log(`\n--- Benchmark Results (${NUM_TEMPLATES} templates, ${ITERATIONS} iterations) ---`);
console.log(`Legacy (new Date().getTime()): ${legacyTime.toFixed(2)} ms`);
console.log(`Optimized (ISO String Comp):  ${optTime.toFixed(2)} ms`);
console.log(`Speedup: ${(legacyTime / optTime).toFixed(2)}x faster\n`);
