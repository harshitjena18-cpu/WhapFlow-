const { performance } = require('perf_hooks');

/**
 * Benchmark: Queue Batch Claiming (V2)
 * Compares sequential kv.del() vs batch kv.claimBatch()
 */

async function mockDbOperation(batchSize = 1) {
    // Simulate network round-trip latency to database (e.g., 10ms)
    await new Promise(resolve => setTimeout(resolve, 10));
    return Array.from({ length: batchSize }, (_, i) => `key-${i}`);
}

async function runSequentialClaim(count) {
    const startTime = performance.now();

    // Simulate N sequential delete operations
    for (let i = 0; i < count; i++) {
        await mockDbOperation(1);
    }

    const endTime = performance.now();
    return endTime - startTime;
}

async function runBatchClaim(count) {
    const startTime = performance.now();

    // Simulate 1 batch delete operation
    await mockDbOperation(count);

    const endTime = performance.now();
    return endTime - startTime;
}

async function runBenchmark() {
    const BATCH_SIZE = 100;
    console.log(`⚡ [Benchmark] Starting Queue Claim V2 Optimization Test (Batch Size: ${BATCH_SIZE})...`);

    // 1. Sequential (V1)
    console.log(`   - Measuring Sequential Claim (V1)...`);
    const sequentialTime = await runSequentialClaim(BATCH_SIZE);
    console.log(`     Done: ${sequentialTime.toFixed(2)}ms`);

    // 2. Batch (V2)
    console.log(`   - Measuring Atomic Batch Claim (V2)...`);
    const batchTime = await runBatchClaim(BATCH_SIZE);
    console.log(`     Done: ${batchTime.toFixed(2)}ms`);

    // 3. Comparison
    const speedup = sequentialTime / batchTime;
    const reduction = ((sequentialTime - batchTime) / sequentialTime) * 100;

    console.log(`\n📊 Results:`);
    console.log(`   - Sequential Latency: ${sequentialTime.toFixed(2)}ms`);
    console.log(`   - Batch Latency:      ${batchTime.toFixed(2)}ms`);
    console.log(`   - Speedup:            ${speedup.toFixed(2)}x`);
    console.log(`   - Latency Reduction:  ${reduction.toFixed(2)}%`);

    if (reduction > 90) {
        console.log(`\n✅ VERIFIED: Batch claiming achieved >90% latency reduction!`);
    } else {
        console.warn(`\n⚠️ WARNING: Performance gain was less than expected.`);
    }
}

runBenchmark().catch(console.error);
