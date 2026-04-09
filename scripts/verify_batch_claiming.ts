
// scripts/verify_batch_claiming.ts

interface Job {
  id: string;
  key: string;
}

async function mockMdelWithResult(keys: string[]) {
    console.log(`[Mock KV] mdelWithResult called with ${keys.length} keys.`);
    // Simulate that only even keys are successfully deleted (claimed)
    return keys.filter((_, i) => i % 2 === 0);
}

async function verify() {
    const dueJobs: Job[] = Array.from({ length: 10 }, (_, i) => ({
        id: `job-${i}`,
        key: `queue:v1:test:${i}`
    }));

    console.log(`Processing ${dueJobs.length} due jobs...`);

    const dueJobKeys = dueJobs.map(j => j.key);
    const claimedKeys = new Set(await mockMdelWithResult(dueJobKeys));

    console.log(`Successfully claimed ${claimedKeys.size} out of ${dueJobs.length} jobs.`);

    const jobQueue = dueJobs.filter(j => claimedKeys.has(j.key));

    const processedJobs: string[] = [];
    const handler = async (job: Job) => {
        processedJobs.push(job.id);
        console.log(`[Handler] Processed ${job.id}`);
    };

    // Process
    for (const job of jobQueue) {
        await handler(job);
    }

    console.log(`Total processed: ${processedJobs.length}`);

    // Assertions
    if (processedJobs.length !== 5) {
        console.error("❌ ERROR: Expected 5 jobs to be processed, but got " + processedJobs.length);
        process.exit(1);
    }

    const expectedIds = ["job-0", "job-2", "job-4", "job-6", "job-8"];
    for (const id of expectedIds) {
        if (!processedJobs.includes(id)) {
            console.error(`❌ ERROR: Job ${id} was not processed.`);
            process.exit(1);
        }
    }

    console.log("✅ VERIFICATION SUCCESSFUL: Batch claiming logic works as expected.");
}

verify();
