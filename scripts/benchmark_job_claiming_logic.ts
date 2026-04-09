
import { performance } from 'node:perf_hooks';

async function mockDel(key: string) {
    // Simulate DB roundtrip (10ms)
    await new Promise(resolve => setTimeout(resolve, 10));
    return true;
}

async function mockMdelWithResult(keys: string[]) {
    // Simulate DB roundtrip for batch (slightly slower than single del, e.g., 20ms)
    await new Promise(resolve => setTimeout(resolve, 20));
    return keys;
}

async function benchmark() {
    const keys = Array.from({ length: 100 }, (_, i) => `key-${i}`);

    console.log(`Benchmarking claiming ${keys.length} jobs...`);

    // Sequential
    const startSeq = performance.now();
    for (const key of keys) {
        await mockDel(key);
    }
    const endSeq = performance.now();
    const seqTime = endSeq - startSeq;
    console.log(`Sequential claiming took: ${seqTime.toFixed(2)}ms`);

    // Batch
    const startBatch = performance.now();
    await mockMdelWithResult(keys);
    const endBatch = performance.now();
    const batchTime = endBatch - startBatch;
    console.log(`Batch claiming took: ${batchTime.toFixed(2)}ms`);

    console.log(`\nEstimated Reduction: ${(seqTime - batchTime).toFixed(2)}ms (${(seqTime / batchTime).toFixed(1)}x faster)`);
}

benchmark();
