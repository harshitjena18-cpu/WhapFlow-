const { performance } = require('perf_hooks');

const KV_LATENCY = 50; // ms

async function mockDel(key) {
    await new Promise(resolve => setTimeout(resolve, KV_LATENCY));
    return true;
}

async function mockClaimBatch(keys) {
    await new Promise(resolve => setTimeout(resolve, KV_LATENCY));
    return keys;
}

async function currentClaimWithConcurrency(keys, limit) {
    const start = performance.now();
    const queue = [...keys];
    const worker = async () => {
        while (queue.length > 0) {
            const k = queue.shift();
            if (!k) break;
            await mockDel(k);
        }
    };
    await Promise.all(Array.from({ length: limit }, () => worker()));
    return performance.now() - start;
}

async function optimizedClaim(keys) {
    const start = performance.now();
    await mockClaimBatch(keys);
    return performance.now() - start;
}

async function run() {
    const BATCH_SIZE = 100;
    const CONCURRENCY = 5;
    const keys = Array.from({ length: BATCH_SIZE }, (_, i) => `key-${i}`);

    console.log(`[Benchmark] Claiming ${BATCH_SIZE} jobs with ${KV_LATENCY}ms latency and concurrency ${CONCURRENCY}...`);

    const t1 = await currentClaimWithConcurrency(keys, CONCURRENCY);
    console.log(`Current (Worker loop with individual del): ${t1.toFixed(2)}ms`);

    const t2 = await optimizedClaim(keys);
    console.log(`Optimized (claimBatch): ${t2.toFixed(2)}ms`);

    console.log(`Wall-clock Reduction: ${(t1 - t2).toFixed(2)}ms (${((t1 - t2) / t1 * 100).toFixed(1)}%)`);
    console.log(`Database Round-trips: ${BATCH_SIZE} -> 1`);
}

run();
