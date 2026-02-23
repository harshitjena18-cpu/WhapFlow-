// scripts/benchmark_automation_fetch.ts

// Mock types
interface AutomationTemplate {
  id: string;
  template_name: string;
  enabled: boolean;
  content: string; // Large content
}

// Mock Data: 100 templates, only 1 enabled
const MOCK_TEMPLATES: AutomationTemplate[] = Array.from({ length: 100 }, (_, i) => ({
  id: `tpl_${i}`,
  template_name: `Template ${i}`,
  enabled: i === 50, // Only one enabled
  content: "A".repeat(1024) // 1KB content
}));

// Mock Latency
const LATENCY_MS = 50;

// Mock KV Store
const kv = {
  // Simulate fetching all templates (scan + transfer all)
  async getByPrefix(prefix: string): Promise<AutomationTemplate[]> {
    await new Promise(r => setTimeout(r, LATENCY_MS + 10)); // Extra latency for larger payload?
    // In reality, DB scan is O(N) but transfer is O(N)
    return [...MOCK_TEMPLATES];
  },

  // Simulate optimized fetch (DB-side filter + limit 1)
  async getByPrefixAndValue(prefix: string, path: string, value: any, limit?: number): Promise<AutomationTemplate[]> {
    await new Promise(r => setTimeout(r, LATENCY_MS));
    // Filter in DB (scan O(N) but transfer O(1))
    const filtered = MOCK_TEMPLATES.filter(t => t.enabled === value);
    if (limit) return filtered.slice(0, limit);
    return filtered;
  }
};

async function runBenchmark() {
  console.log("Starting Benchmark: Fetching Templates for Automation Check");
  console.log("Scenario: 100 templates, 1 enabled. Payload size per template: ~1KB");

  // 1. Unoptimized: Fetch All
  const startUnopt = performance.now();
  const allTemplates = await kv.getByPrefix("shop:test:template:");
  const hasEnabledUnopt = allTemplates.some(t => t.enabled);
  const endUnopt = performance.now();

  const payloadSizeUnopt = allTemplates.length * 1024; // approx
  console.log(`\n[Unoptimized] getByPrefix:`);
  console.log(`  - Time: ${(endUnopt - startUnopt).toFixed(2)}ms`);
  console.log(`  - Items Fetched: ${allTemplates.length}`);
  console.log(`  - Payload Size: ~${payloadSizeUnopt / 1024} KB`);
  console.log(`  - Result: ${hasEnabledUnopt}`);

  // 2. Optimized: Fetch Enabled Only (Limit 1)
  const startOpt = performance.now();
  const enabledTemplates = await kv.getByPrefixAndValue("shop:test:template:", "value->enabled", true, 1);
  const hasEnabledOpt = enabledTemplates.length > 0; // Check length instead of some (or some works too)
  const endOpt = performance.now();

  const payloadSizeOpt = enabledTemplates.length * 1024;
  console.log(`\n[Optimized] getByPrefixAndValue (limit=1):`);
  console.log(`  - Time: ${(endOpt - startOpt).toFixed(2)}ms`);
  console.log(`  - Items Fetched: ${enabledTemplates.length}`);
  console.log(`  - Payload Size: ~${payloadSizeOpt / 1024} KB`);
  console.log(`  - Result: ${hasEnabledOpt}`);

  // Comparison
  const speedup = (endUnopt - startUnopt) / (endOpt - startOpt);
  const payloadReduction = payloadSizeUnopt / payloadSizeOpt;

  console.log(`\n[Comparison]`);
  console.log(`  - Speedup (simulated): ${speedup.toFixed(2)}x`);
  console.log(`  - Payload Reduction: ${payloadReduction.toFixed(2)}x`);
}

runBenchmark();
