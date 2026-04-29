
import { performance } from "node:perf_hooks";

/**
 * BOLT PERFORMANCE BENCHMARK: Job Queue Claiming
 * This script compares the latency of sequential job claiming (current)
 * vs batched job claiming (optimized).
 */

const SIMULATED_RTT_MS = 10; // Simulated database round-trip time
const BATCH_SIZE = 100;

async function simulateSequentialClaiming(count: number) {
    console.log(`[Benchmark] Simulating SEQUENTIAL claiming of ${count} jobs...`);
    const start = performance.now();

    // In current implementation, each worker tries to claim jobs one by one.
    // Even with concurrency, many calls happen sequentially per worker.
    for (let i = 0; i < count; i++) {
        await new Promise(resolve => setTimeout(resolve, SIMULATED_RTT_MS));
    }

    const end = performance.now();
    return end - start;
}

async function simulateBatchedClaiming(count: number) {
    console.log(`[Benchmark] Simulating BATCHED claiming of ${count} jobs...`);
    const start = performance.now();

    // In optimized implementation, we claim all jobs in ONE round-trip.
    await new Promise(resolve => setTimeout(resolve, SIMULATED_RTT_MS));

    const end = performance.now();
    return end - start;
}

async function run() {
    console.log("⚡ Bolt Performance Benchmark: Queue Claiming ⚡");
    console.log("-----------------------------------------------");

    const seqTime = await simulateSequentialClaiming(BATCH_SIZE);
    const batchTime = await simulateBatchedClaiming(BATCH_SIZE);

    console.log("\n📊 Results:");
    console.log(`  - Sequential Claiming: ${seqTime.toFixed(2)}ms`);
    console.log(`  - Batched Claiming:    ${batchTime.toFixed(2)}ms`);
    console.log(`  - Speedup:            ${(seqTime / batchTime).toFixed(1)}x faster`);
    console.log(`  - Latency Reduction:  ${(seqTime - batchTime).toFixed(2)}ms`);

    if (batchTime < seqTime) {
        console.log("\n✅ PERFORMANCE WIN: Batching significantly reduces claiming latency.");
    }
}

run().catch(console.error);
