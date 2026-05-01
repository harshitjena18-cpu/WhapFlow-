
/**
 * scripts/verify_bolt_performance.ts
 *
 * Benchmarks sequential vs batched claiming to verify performance impact of kv.claimBatch.
 */

const DB_LATENCY = 100; // Simulated database round-trip latency in ms

async function mockDel(key: string) {
    // Simulate a successful delete round-trip
    await new Promise(resolve => setTimeout(resolve, DB_LATENCY));
    return true;
}

async function mockClaimBatch(keys: string[]) {
    // Simulate a successful batch delete round-trip (O(1) regardless of N)
    await new Promise(resolve => setTimeout(resolve, DB_LATENCY));
    return keys;
}

async function sequentialClaim(keys: string[]) {
    const start = performance.now();
    const results = [];
    for (const key of keys) {
        if (await mockDel(key)) {
            results.push(key);
        }
    }
    return performance.now() - start;
}

async function parallelClaim(keys: string[]) {
    const start = performance.now();
    const results = await Promise.all(keys.map(key => mockDel(key)));
    return performance.now() - start;
}

async function batchedClaim(keys: string[]) {
    const start = performance.now();
    await mockClaimBatch(keys);
    return performance.now() - start;
}

async function runBenchmark() {
    const BATCH_SIZE = 100;
    const testKeys = Array.from({ length: BATCH_SIZE }, (_, i) => `key-${i}`);

    console.log(`⚡ Bolt Performance Benchmark: Job Claiming (N=${BATCH_SIZE})`);
    console.log(`Database Latency: ${DB_LATENCY}ms\n`);

    // 1. Sequential (Worst case: O(N))
    console.log("Measuring Sequential Claim...");
    const seqTime = await sequentialClaim(testKeys);
    console.log(`  - Sequential: ${seqTime.toFixed(2)}ms`);

    // 2. Parallel (Best case concurrent but still N requests)
    console.log("Measuring Parallel Claim...");
    const parTime = await parallelClaim(testKeys);
    console.log(`  - Parallel:   ${parTime.toFixed(2)}ms`);

    // 3. Batched (Optimal: O(1) request)
    console.log("Measuring Batched Claim...");
    const batchTime = await batchedClaim(testKeys);
    console.log(`  - Batched:    ${batchTime.toFixed(2)}ms`);

    console.log("\n--- Comparison ---");
    console.log(`Speedup vs Sequential: ${(seqTime / batchTime).toFixed(2)}x`);
    console.log(`Speedup vs Parallel:   ${(parTime / batchTime).toFixed(2)}x`);
    console.log(`Latency Reduction:     ${(seqTime - batchTime).toFixed(2)}ms`);
}

runBenchmark().catch(console.error);
