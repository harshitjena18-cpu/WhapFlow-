
// scripts/benchmark_parallel.ts

const MOCK_LATENCY = 50; // ms

async function mockFetch(name: string) {
  const start = performance.now();
  await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY));
  // console.log(`Fetched ${name} in ${performance.now() - start}ms`);
  return { name, data: {} };
}

async function sequential() {
  const start = performance.now();
  await mockFetch("A");
  await mockFetch("B");
  await mockFetch("C");
  await mockFetch("D");
  return performance.now() - start;
}

async function parallel() {
  const start = performance.now();
  await Promise.all([
    mockFetch("A"),
    mockFetch("B"),
    mockFetch("C"),
    mockFetch("D")
  ]);
  return performance.now() - start;
}

async function run() {
  const iterations = 20;
  let totalSeq = 0;
  let totalPar = 0;

  console.log(`Running benchmark with ${iterations} iterations...`);
  console.log(`Simulated Latency: ${MOCK_LATENCY}ms per call\n`);

  for (let i = 0; i < iterations; i++) {
    totalSeq += await sequential();
    totalPar += await parallel();
  }

  const avgSeq = totalSeq / iterations;
  const avgPar = totalPar / iterations;

  console.log("--- Results ---");
  console.log(`Sequential (4 calls): ${avgSeq.toFixed(2)}ms`);
  console.log(`Parallel (4 calls):   ${avgPar.toFixed(2)}ms`);
  console.log(`Speedup:              ${(avgSeq / avgPar).toFixed(2)}x`);
  console.log(`Savings per request:  ${(avgSeq - avgPar).toFixed(2)}ms`);
}

run();
