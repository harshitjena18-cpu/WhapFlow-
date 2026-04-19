
const DB_LATENCY = 50; // ms per round-trip

async function mockDbDeleteBatch(keys: string[]) {
    await new Promise(resolve => setTimeout(resolve, DB_LATENCY));
    return keys; // successfully "claimed" all
}

async function mockDbDeleteSingle(key: string) {
    await new Promise(resolve => setTimeout(resolve, DB_LATENCY));
    return true; // successfully "claimed"
}

async function runSequentialClaim(count: number) {
    const start = Date.now();
    for (let i = 0; i < count; i++) {
        await mockDbDeleteSingle(`job:${i}`);
    }
    return Date.now() - start;
}

async function runBatchClaim(count: number) {
    const start = Date.now();
    const keys = Array.from({ length: count }, (_, i) => `job:${i}`);
    await mockDbDeleteBatch(keys);
    return Date.now() - start;
}

async function run() {
    const JOB_COUNT = 20;
    console.log(`Running benchmark: Claiming ${JOB_COUNT} jobs...`);
    console.log(`Simulated DB Latency: ${DB_LATENCY}ms\n`);

    const seqTime = await runSequentialClaim(JOB_COUNT);
    const batchTime = await runBatchClaim(JOB_COUNT);

    console.log(`Sequential Claim (O(N)): ${seqTime}ms`);
    console.log(`Batch Claim (O(1)):      ${batchTime}ms`);
    console.log(`Reduction:               ${seqTime - batchTime}ms (${((seqTime - batchTime) / seqTime * 100).toFixed(1)}%)`);
    console.log(`Speedup:                 ${(seqTime / batchTime).toFixed(1)}x`);
}

run();
