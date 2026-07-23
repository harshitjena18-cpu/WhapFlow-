// scripts/benchmark_templates_sort.ts

interface Template {
  id: string;
  created_at: string;
}

function generateMockTemplates(count: number): Template[] {
  const templates: Template[] = [];
  const baseTime = new Date("2026-01-01T00:00:00.000Z").getTime();
  for (let i = 0; i < count; i++) {
    // Random dates within a range
    const randomOffset = Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000);
    const date = new Date(baseTime + randomOffset);
    templates.push({
      id: `tmpl_${i}`,
      created_at: date.toISOString()
    });
  }
  return templates;
}

function benchmark() {
  const counts = [10, 100, 1000];
  const iterations = 1000;

  console.log("⚡ Benchmarking Template Sorting Performance ⚡");
  console.log(`Running ${iterations} iterations per size.\n`);

  for (const count of counts) {
    console.log(`--- Dataset Size: ${count} Templates ---`);
    const originalDataset = generateMockTemplates(count);

    // 1. Baseline: new Date().getTime()
    const baselineDataset = [...originalDataset];
    const startBaseline = performance.now();
    for (let i = 0; i < iterations; i++) {
      const arr = [...baselineDataset];
      arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    const endBaseline = performance.now();
    const baselineTime = endBaseline - startBaseline;

    // 2. Optimized: string localeCompare
    const optLocaleDataset = [...originalDataset];
    const startOptLocale = performance.now();
    for (let i = 0; i < iterations; i++) {
      const arr = [...optLocaleDataset];
      arr.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    const endOptLocale = performance.now();
    const optLocaleTime = endOptLocale - startOptLocale;

    // 3. Optimized: direct string operators
    const optDirectDataset = [...originalDataset];
    const startOptDirect = performance.now();
    for (let i = 0; i < iterations; i++) {
      const arr = [...optDirectDataset];
      arr.sort((a, b) => b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0);
    }
    const endOptDirect = performance.now();
    const optDirectTime = endOptDirect - startOptDirect;

    console.log(`Baseline (Date conversion):    ${baselineTime.toFixed(2)}ms`);
    console.log(`Opt 1 (String localeCompare):  ${optLocaleTime.toFixed(2)}ms (Speedup: ${(baselineTime / optLocaleTime).toFixed(2)}x)`);
    console.log(`Opt 2 (Direct string comparison): ${optDirectTime.toFixed(2)}ms (Speedup: ${(baselineTime / optDirectTime).toFixed(2)}x)`);
    console.log("");
  }
}

benchmark();
