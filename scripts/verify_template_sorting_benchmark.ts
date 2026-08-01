// scripts/verify_template_sorting_benchmark.ts

import { AutomationTemplate } from "../src/supabase/functions/server/types.ts";

// Generate mock templates with ISO-8601 dates
const generateTemplates = (count: number): AutomationTemplate[] => {
  const templates: AutomationTemplate[] = [];
  const baseTime = Date.now();
  for (let i = 0; i < count; i++) {
    // Random dates distributed over past year
    const randomOffset = Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000);
    const dateStr = new Date(baseTime - randomOffset).toISOString();
    templates.push({
      id: `tpl_${i}`,
      template_name: `template_${i}`,
      display_name: `Template ${i}`,
      delay_minutes: 30,
      content: "Hello",
      enabled: false,
      created_at: dateStr,
      generated_by_ai: false,
      ai_tone: null
    });
  }
  return templates;
};

function benchmarkSort(templates: AutomationTemplate[], count: number) {
  const iterations = 500;

  // 1. Date parsing sorting (Baseline)
  const baselineTemplates = [...templates];
  const startBaseline = performance.now();
  for (let i = 0; i < iterations; i++) {
    // copy array to reset order
    const arr = [...baselineTemplates];
    arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  const endBaseline = performance.now();
  const baselineTime = endBaseline - startBaseline;

  // 2. Lexicographical string comparison (Optimized)
  const optimizedTemplates = [...templates];
  const startOptimized = performance.now();
  for (let i = 0; i < iterations; i++) {
    const arr = [...optimizedTemplates];
    arr.sort((a, b) => {
      const dateA = a.created_at || "";
      const dateB = b.created_at || "";
      return dateB > dateA ? 1 : dateB < dateA ? -1 : 0;
    });
  }
  const endOptimized = performance.now();
  const optimizedTime = endOptimized - startOptimized;

  console.log(`\n=== Template Sorting Benchmark (N = ${count} templates, ${iterations} iterations) ===`);
  console.log(`Baseline (Date Parsing): ${baselineTime.toFixed(2)}ms`);
  console.log(`Optimized (String Comparison): ${optimizedTime.toFixed(2)}ms`);
  console.log(`Speedup: ${(baselineTime / optimizedTime).toFixed(2)}x faster`);
}

const templatesSmall = generateTemplates(50);
const templatesLarge = generateTemplates(1000);

benchmarkSort(templatesSmall, 50);
benchmarkSort(templatesLarge, 1000);
