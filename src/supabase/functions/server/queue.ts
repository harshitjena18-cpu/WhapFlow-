
import * as kv from "./kv_store.tsx";

export interface Job {
  id: string;
  key: string;
  payload: Record<string, unknown>;
  scheduled_for: string; // ISO Date
  created_at: string;
}

/**
 * Add a job to the queue.
 */
export async function enqueueJob(payload: Record<string, unknown>, delayMinutes: number) {
  const id = crypto.randomUUID();
  const now = new Date();
  const scheduledFor = new Date(now.getTime() + delayMinutes * 60 * 1000).toISOString();

  // Key format: queue:v1:{scheduled_for_timestamp}:{random_id}
  // We use timestamp in key to allow potential range queries if we improved the KV store,
  // but for now we'll just scan.
  const key = `queue:v1:${scheduledFor}:${id}`;

  const job: Job = {
    id,
    key,
    payload,
    scheduled_for: scheduledFor,
    created_at: now.toISOString()
  };

  await kv.set(key, job);
  console.log(`[Queue] Enqueued job ${id} for ${scheduledFor}`);
  return job;
}

/**
 * Process pending jobs.
 * @param handler Function to execute for each job.
 */
export async function processPendingJobs(handler: (payload: Record<string, unknown>) => Promise<void>) {
  const now = new Date();
  const endKey = `queue:v1:${now.toISOString()}`; // Fetch anything scheduled up to "now"

  console.log(`[Queue] Checking for jobs scheduled before ${now.toISOString()}...`);

  // Optimized Fetch: Uses DB range query instead of memory filter
  const dueJobs = await kv.scanQueue(endKey);

  console.log(`[Queue] Found ${dueJobs.length} due jobs.`);

  // Process jobs concurrently with a limit to avoid overwhelming resources
  const CONCURRENCY_LIMIT = 5;
  const jobQueue = [...dueJobs];

  const worker = async () => {
    while (jobQueue.length > 0) {
      const job = jobQueue.shift();
      if (!job) break;

      // ATOMIC CLAIM: Try to delete the key first.
      // If kv.del returns true, it means WE successfully deleted it, so we own the job.
      // If false, another worker beat us to it.
      const claimed = await kv.del(job.key);

      if (claimed) {
        try {
          console.log(`[Queue] Claimed & Processing job ${job.id}...`);
          await handler(job.payload);
          console.log(`[Queue] Job ${job.id} completed.`);
        } catch (error) {
          console.error(`[Queue] Error processing job ${job.id}:`, error);
          // Move to dead-letter queue
          await kv.set(`queue:failed:${job.id}`, { ...job, error: String(error) });
        }
      } else {
        console.log(`[Queue] Job ${job.id} already claimed by another worker.`);
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY_LIMIT }, () => worker()));
}
