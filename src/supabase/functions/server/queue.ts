import * as kv from "./kv_store.tsx";

export interface Job<T = unknown> {
  id: string;
  key: string;
  payload: T;
  scheduled_for: string; // ISO Date
  created_at: string;
}

/**
 * Create a job object without persisting it to the database.
 * PERFORMANCE: Allows batching the job creation with other database writes.
 */
export function createJob<T = unknown>(payload: T, delayMinutes: number): Job<T> {
  const id = crypto.randomUUID();
  const now = new Date();
  const scheduledFor = new Date(now.getTime() + delayMinutes * 60 * 1000).toISOString();

  // Key format: queue:v1:{scheduled_for_timestamp}:{random_id}
  // We use timestamp in key to allow efficient range queries in scanQueue.
  const key = `queue:v1:${scheduledFor}:${id}`;

  return {
    id,
    key,
    payload,
    scheduled_for: scheduledFor,
    created_at: now.toISOString()
  };
}

/**
 * Add a job to the queue.
 */
export async function enqueueJob<T = unknown>(payload: T, delayMinutes: number) {
  const job = createJob(payload, delayMinutes);
  await kv.set(job.key, job);
  console.log(`[Queue] Enqueued job ${job.id} for ${job.scheduled_for}`);
  return job;
}

/**
 * Process pending jobs.
 * @param handler Function to execute for each job.
 */
export async function processPendingJobs<T = unknown>(handler: (payload: T) => Promise<void>) {
  const now = new Date();
  const endKey = `queue:v1:${now.toISOString()}`; // Fetch anything scheduled up to "now"
  const BATCH_SIZE = 100;

  console.log(`[Queue] Checking for jobs scheduled before ${now.toISOString()}...`);

  // Optimized Fetch: Uses DB range query with limit to prevent OOM
  const dueJobs = await kv.scanQueue(endKey, BATCH_SIZE);

  console.log(`[Queue] Found ${dueJobs.length} due jobs (capped at ${BATCH_SIZE}).`);

  // 1. ATOMIC BATCH CLAIM: Claim all due jobs in a single database round-trip.
  // This eliminates the N+1 problem where each job required a separate 'kv.del' call.
  const jobKeys = dueJobs.map(j => (j as Job<T>).key);
  const claimedKeys = new Set(await kv.mdelWithResult(jobKeys));

  console.log(`[Queue] Successfully claimed ${claimedKeys.size} of ${dueJobs.length} jobs.`);

  // 2. Process claimed jobs concurrently with a limit.
  const CONCURRENCY_LIMIT = 5;
  const claimedJobs = (dueJobs as Job<T>[]).filter(j => claimedKeys.has(j.key));

  const worker = async () => {
    while (claimedJobs.length > 0) {
      const job = claimedJobs.shift();
      if (!job) break;

      try {
        console.log(`[Queue] Processing job ${job.id}...`);
        await handler(job.payload);
        console.log(`[Queue] Job ${job.id} completed.`);
      } catch (error) {
        console.error(`[Queue] Error processing job ${job.id}:`, error);
        // Move to dead-letter queue
        await kv.set(`queue:failed:${job.id}`, { ...job, error: String(error) });
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY_LIMIT }, () => worker()));
}
