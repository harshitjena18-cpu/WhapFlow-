import { performance } from "perf_hooks";

interface AutomationTemplate {
  id: string;
  template_name: string;
  display_name: string;
  created_at: string;
}

function runBenchmark() {
  const NUM_TEMPLATES = 1000;
  const NUM_ITERATIONS = 500;

  console.log(`Generating ${NUM_TEMPLATES} mock templates...`);
  const templates: AutomationTemplate[] = Array.from({ length: NUM_TEMPLATES }, (_, i) => ({
    id: `template_${i}`,
    template_name: `template_name_${i}`,
    display_name: `Template ${i}`,
    created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
  }));

  // Benchmark 1: Date parsing sort
  const startParsing = performance.now();
  for (let i = 0; i < NUM_ITERATIONS; i++) {
    const list = [...templates];
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  const endParsing = performance.now();
  const parsingTime = endParsing - startParsing;

  // Benchmark 2: Direct string comparison sort
  const startString = performance.now();
  for (let i = 0; i < NUM_ITERATIONS; i++) {
    const list = [...templates];
    list.sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));
  }
  const endString = performance.now();
  const stringTime = endString - startString;

  console.log("\n--- BENCHMARK RESULTS ---");
  console.log(`Date parsing sort:           ${parsingTime.toFixed(2)} ms`);
  console.log(`Direct string ternary sort:  ${stringTime.toFixed(2)} ms`);
  const speedup = parsingTime / stringTime;
  console.log(`Speedup factor:              ${speedup.toFixed(2)}x faster`);

  // Correctness check
  const listA = [...templates].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const listB = [...templates].sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));

  const isIdentical = listA.every((t, idx) => t.id === listB[idx].id);
  if (!isIdentical) {
    console.error("❌ ERROR: Sorted order mismatch between methods!");
    process.exit(1);
  }
  console.log("✅ Verification: Both sort methods produce identical order.");
}

runBenchmark();
