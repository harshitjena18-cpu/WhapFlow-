// Benchmark template sorting performance: Date parsing vs direct string comparison.
// This is used to verify Bolt's sorting optimization.

function generateMockData(count: number) {
  const data = [];
  const baseDate = new Date("2026-01-01T00:00:00.000Z").getTime();

  for (let i = 0; i < count; i++) {
    // Generate random offset in milliseconds (within ~1 year)
    const offset = Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000);
    const dateStr = new Date(baseDate + offset).toISOString();
    data.push({
      id: `id-${i}`,
      created_at: dateStr
    });
  }
  return data;
}

function benchmark() {
  const count = 10000;
  console.log(`⚡ Generating ${count} mock templates with ISO-8601 timestamps...`);
  const originalData = generateMockData(count);

  console.log("\n🐌 Measuring Date-parsing sorting...");
  const dateData = [...originalData];
  const startParsing = performance.now();

  dateData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const endParsing = performance.now();
  const timeParsing = endParsing - startParsing;
  console.log(`   - Time: ${timeParsing.toFixed(2)}ms`);

  console.log("\n🚀 Measuring direct string relational sorting...");
  const stringData = [...originalData];
  const startString = performance.now();

  stringData.sort((a, b) => {
    const dateA = a.created_at || "";
    const dateB = b.created_at || "";
    return dateB > dateA ? 1 : dateB < dateA ? -1 : 0;
  });

  const endString = performance.now();
  const timeString = endString - startString;
  console.log(`   - Time: ${timeString.toFixed(2)}ms`);

  // Verify correctness
  let correct = true;
  for (let i = 0; i < count; i++) {
    if (dateData[i].id !== stringData[i].id) {
      correct = false;
      break;
    }
  }

  const speedup = timeParsing / timeString;
  const reduction = ((timeParsing - timeString) / timeParsing) * 100;

  console.log("\n--- Comparison ---");
  console.log(`Correctness Verified: ${correct ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Speedup Factor:       ${speedup.toFixed(2)}x faster`);
  console.log(`Latency Reduction:    ${reduction.toFixed(1)}%`);
}

benchmark();
