const { performance } = require('perf_hooks');

// Simulation of DB round-trip latency
const DB_LATENCY = 10; // ms

async function mockMdelWithResult(keys) {
    // Simulate one DB round-trip
    await new Promise(resolve => setTimeout(resolve, DB_LATENCY));
    // In our simulation, we successfully claim all keys
    return keys;
}

async function mockDel(key) {
    // Simulate one DB round-trip per call
    await new Promise(resolve => setTimeout(resolve, DB_LATENCY));
    return true;
}

async function runSequentialClaim(keys) {
    const start = performance.now();
    const claimed = [];
    for (const key of keys) {
        if (await mockDel(key)) {
            claimed.push(key);
        }
    }
    const end = performance.now();
    return end - start;
}

async function runBatchClaim(keys) {
    const start = performance.now();
    const claimed = await mockMdelWithResult(keys);
    const end = performance.now();
    return end - start;
}

async function run() {
    const numJobs = 100;
    const keys = Array.from({ length: numJobs }, (_, i) => `job:${i}`);

    console.log(`--- Job Queue Claiming Benchmark (${numJobs} jobs) ---`);
    console.log(`Simulated DB Latency: ${DB_LATENCY}ms per round-trip\n`);

    const seqTime = await runSequentialClaim(keys);
    console.log(`Sequential Claiming (Current): ${seqTime.toFixed(2)}ms`);

    const batchTime = await runBatchClaim(keys);
    console.log(`Batch Claiming (Optimized): ${batchTime.toFixed(2)}ms`);

    const reduction = seqTime - batchTime;
    const percent = (reduction / seqTime) * 100;

    console.log(`\nLatency Reduction: ${reduction.toFixed(2)}ms (${percent.toFixed(1)}% improvement)`);
}

run();
