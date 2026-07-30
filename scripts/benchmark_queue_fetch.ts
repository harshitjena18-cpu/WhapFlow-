// scripts/benchmark_queue_fetch.ts

const getHeapUsed = () => {
  if (typeof Deno !== "undefined" && typeof Deno.memoryUsage === "function") {
    try {
      return Deno.memoryUsage().heapUsed;
    } catch {
      // ignore
    }
  }
  // @ts-ignore Compatibility with Node
  if (typeof process !== "undefined" && typeof process.memoryUsage === "function") {
    // @ts-ignore Compatibility with Node
    return process.memoryUsage().heapUsed;
  }
  return 0;
};

// Simulate a large job payload
const basePayload = {
    data: "x".repeat(1024), // 1KB of data
    meta: {
        source: "test",
        timestamp: Date.now()
    }
};

interface Job {
  id: string;
  key: string;
  payload: any;
  scheduled_for: string;
  created_at: string;
}

function createJob(id: number): Job {
    return {
        id: `job-${id}`,
        key: `queue:v1:test:${id}`,
        payload: { ...basePayload, unique: id },
        scheduled_for: new Date().toISOString(),
        created_at: new Date().toISOString()
    };
}

async function mockScanQueue(limit?: number): Promise<Job[]> {
    // If limit is provided, fetch limit items. Otherwise fetch all (e.g. 10,000)
    const count = limit || 10000;

    // Simulate DB latency
    await new Promise(resolve => setTimeout(resolve, 50));

    const jobs: Job[] = [];
    for (let i = 0; i < count; i++) {
        jobs.push(createJob(i));
    }
    return jobs;
}

async function runBenchmark(limit?: number) {
    const startMemory = getHeapUsed();
    const startTime = performance.now();

    console.log(`[Benchmark] Simulating fetch with limit=${limit || 'NONE'}...`);
    const jobs = await mockScanQueue(limit);

    const endTime = performance.now();
    const endMemory = getHeapUsed();

    const memoryDiff = (endMemory - startMemory) / 1024 / 1024; // MB
    const timeDiff = endTime - startTime; // ms

    console.log(`  - Jobs Fetched: ${jobs.length}`);
    console.log(`  - Time: ${timeDiff.toFixed(2)}ms`);
    console.log(`  - Memory Increase: ${memoryDiff.toFixed(2)} MB`);

    return { timeDiff, memoryDiff, jobsCount: jobs.length };
}

(async () => {
    console.log("Starting Benchmark...");

    // baseline: unbounded fetch
    const baseline = await runBenchmark(undefined);

    // optimized: bounded fetch
    const optimized = await runBenchmark(100);

    console.log("\n--- Comparison ---");
    console.log(`Memory Usage Reduction: ${(baseline.memoryDiff - optimized.memoryDiff).toFixed(2)} MB`);
    console.log(`Time Reduction: ${(baseline.timeDiff - optimized.timeDiff).toFixed(2)} ms`);
})();
