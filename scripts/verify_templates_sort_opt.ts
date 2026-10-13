import { performance } from "perf_hooks";

interface AutomationTemplate {
  id: string;
  template_name: string;
  display_name: string;
  delay_minutes: number;
  content: string;
  generated_by_ai: boolean;
  ai_tone: string | null;
  enabled: boolean;
  created_at: string;
}

// Generate sample templates with ISO 8601 timestamps
function generateTemplates(count: number): AutomationTemplate[] {
  const templates: AutomationTemplate[] = [];
  const baseTime = new Date("2025-01-01T00:00:00.000Z").getTime();
  for (let i = 0; i < count; i++) {
    // Random timestamps within a 100-day window
    const randomOffset = Math.floor(Math.random() * 100 * 24 * 60 * 60 * 1000);
    templates.push({
      id: `tmpl-${i}`,
      template_name: `template_${i}`,
      display_name: `Template ${i}`,
      delay_minutes: 30,
      content: `Hello ${i}`,
      generated_by_ai: false,
      ai_tone: null,
      enabled: false,
      created_at: new Date(baseTime + randomOffset).toISOString()
    });
  }
  return templates;
}

const N = 100;
const ITERATIONS = 1000;
const mockTemplates = generateTemplates(N);

// Baseline: new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
const startBaseline = performance.now();
for (let iter = 0; iter < ITERATIONS; iter++) {
  const list = [...mockTemplates];
  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
const baselineTime = performance.now() - startBaseline;

// Optimized: direct string comparison
const startOptimized = performance.now();
for (let iter = 0; iter < ITERATIONS; iter++) {
  const list = [...mockTemplates];
  list.sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));
}
const optimizedTime = performance.now() - startOptimized;

// Verification: check both produce identical sort order
const list1 = [...mockTemplates].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
const list2 = [...mockTemplates].sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));

const isIdentical = list1.every((t, idx) => t.id === list2[idx].id);

console.log(`Sort Order Verification: ${isIdentical ? "PASSED ✅" : "FAILED ❌"}`);
console.log(`Baseline (new Date().getTime()): ${baselineTime.toFixed(2)} ms`);
console.log(`Optimized (string compare):     ${optimizedTime.toFixed(2)} ms`);
console.log(`Speedup:                        ${(baselineTime / optimizedTime).toFixed(2)}x faster`);

if (!isIdentical) {
  process.exit(1);
}
