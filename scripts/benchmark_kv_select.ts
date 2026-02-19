
// scripts/benchmark_kv_select.ts

function calculateSize(data: any) {
  return JSON.stringify(data).length;
}

function simulatePayload(count: number, includeKey: boolean) {
  const data = [];
  for (let i = 0; i < count; i++) {
    const item: any = {
      value: {
        id: `id-${i}`,
        template_name: `template-${i}`,
        content: "This is a long content string for the template that takes some space to simulate a real-world scenario where templates or jobs have significant content.",
        enabled: true,
        created_at: new Date().toISOString()
      }
    };
    if (includeKey) {
      // Keys are typically long strings in this KV store
      item.key = `shop:example-merchant-store-with-long-name.myshopify.com:template:id-${i}`;
    }
    data.push(item);
  }
  return data;
}

const COUNT = 200;
const withKey = simulatePayload(COUNT, true);
const withoutKey = simulatePayload(COUNT, false);

const sizeWithKey = calculateSize(withKey);
const sizeWithoutKey = calculateSize(withoutKey);

console.log("--- KV Select Optimization Benchmark ---");
console.log(`Record Count: ${COUNT}`);
console.log(`Payload Size (with 'key' column):    ${sizeWithKey} chars`);
console.log(`Payload Size (without 'key' column): ${sizeWithoutKey} chars`);
const reductionChars = sizeWithKey - sizeWithoutKey;
const reductionPercent = (1 - sizeWithoutKey / sizeWithKey) * 100;
console.log(`Reduction:                           ${reductionChars} chars (${reductionPercent.toFixed(2)}%)`);

// Measure JSON Parsing Latency
let totalTimeWithKey = 0;
let totalTimeWithoutKey = 0;
const ITERATIONS = 100;

for (let i = 0; i < ITERATIONS; i++) {
  const jsonWith = JSON.stringify(withKey);
  const start1 = performance.now();
  JSON.parse(jsonWith);
  totalTimeWithKey += (performance.now() - start1);

  const jsonWithout = JSON.stringify(withoutKey);
  const start2 = performance.now();
  JSON.parse(jsonWithout);
  totalTimeWithoutKey += (performance.now() - start2);
}

console.log(`Average JSON Parsing Latency (with key):     ${(totalTimeWithKey / ITERATIONS).toFixed(4)}ms`);
console.log(`Average JSON Parsing Latency (without key):  ${(totalTimeWithoutKey / ITERATIONS).toFixed(4)}ms`);
console.log(`Parsing Speedup:                             ${((totalTimeWithKey / totalTimeWithoutKey - 1) * 100).toFixed(2)}%`);
