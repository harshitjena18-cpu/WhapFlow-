// scripts/verify_template_sorting_benchmark.ts

const numItems = 1000;
const iterations = 500;

interface TestItem {
  id: string;
  created_at: string;
}

function generateItems(count: number): TestItem[] {
  const items: TestItem[] = [];
  const baseTime = Date.now();
  for (let i = 0; i < count; i++) {
    // Generate ISO strings at random times
    const randomTime = baseTime - Math.floor(Math.random() * 10000000);
    items.push({
      id: `id_${i}`,
      created_at: new Date(randomTime).toISOString(),
    });
  }
  return items;
}

function benchmarkNewDateSort(items: TestItem[]): number {
  const arr = [...items];
  const start = performance.now();
  arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const end = performance.now();
  return end - start;
}

function benchmarkStringSort(items: TestItem[]): number {
  const arr = [...items];
  const start = performance.now();
  arr.sort((a, b) => {
    const dateA = a.created_at || '';
    const dateB = b.created_at || '';
    return dateA < dateB ? 1 : dateA > dateB ? -1 : 0;
  });
  const end = performance.now();
  return end - start;
}

function run() {
  console.log(`Running benchmark with ${numItems} items over ${iterations} iterations...`);

  let totalNewDate = 0;
  let totalStringSort = 0;

  for (let i = 0; i < iterations; i++) {
    const testData = generateItems(numItems);
    totalNewDate += benchmarkNewDateSort(testData);
    totalStringSort += benchmarkStringSort(testData);
  }

  const avgNewDate = totalNewDate / iterations;
  const avgStringSort = totalStringSort / iterations;

  console.log("\n--- Results ---");
  console.log(`new Date() Sort:    ${avgNewDate.toFixed(4)}ms (avg)`);
  console.log(`String relational:  ${avgStringSort.toFixed(4)}ms (avg)`);
  console.log(`Speedup Factor:     ${(avgNewDate / avgStringSort).toFixed(2)}x faster`);
  console.log(`Savings per call:   ${(avgNewDate - avgStringSort).toFixed(4)}ms`);
}

run();
