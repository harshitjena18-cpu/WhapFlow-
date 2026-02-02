// scripts/benchmark_billing.ts

// Mocks the database latency
const MOCK_DB_LATENCY_MS = 50;

// Type definitions (simplified from billing.ts)
type PlanLevel = 'free' | 'starter' | 'growth' | 'pro';

interface PlanLimits {
  ai_generations: number;
  whatsapp_conversations: number;
  automation_enabled: boolean;
  name: string;
  price: number;
}

interface BillingConfig {
  plan: PlanLevel;
  ai_generations_used: number;
  whatsapp_conversations_used: number;
  billing_cycle_reset_at: string;
  subscription_id?: string;
}

const PLAN_LIMITS: Record<PlanLevel, PlanLimits> = {
  free: {
    name: 'Free',
    price: 0,
    ai_generations: 5,
    whatsapp_conversations: 0,
    automation_enabled: false
  },
  starter: {
    name: 'Starter',
    price: 19.00,
    ai_generations: 30,
    whatsapp_conversations: 300,
    automation_enabled: true
  },
  growth: {
    name: 'Growth',
    price: 49.00,
    ai_generations: 100,
    whatsapp_conversations: 1000,
    automation_enabled: true
  },
  pro: {
    name: 'Pro',
    price: 99.00,
    ai_generations: Infinity,
    whatsapp_conversations: 3000,
    automation_enabled: true
  }
};

// Mock KV Store
const mockKvStore = {
  async get(key: string): Promise<BillingConfig> {
    await new Promise(resolve => setTimeout(resolve, MOCK_DB_LATENCY_MS));
    return {
      plan: 'starter',
      ai_generations_used: 10,
      whatsapp_conversations_used: 50,
      billing_cycle_reset_at: new Date().toISOString()
    };
  }
};

// --- Implementations ---

// Current Implementation: Checks limits by calling DB each time
async function checkLimitCurrent(metric: 'ai' | 'whatsapp' | 'automation', shop: string = "global"): Promise<{ allowed: boolean; error?: string }> {
  const config = await mockKvStore.get(`billing:config:${shop}`);
  const limits = PLAN_LIMITS[config.plan];

  if (metric === 'ai') {
    if (config.ai_generations_used >= limits.ai_generations) {
      return { allowed: false, error: `AI generation limit reached.` };
    }
  }
  if (metric === 'whatsapp') {
    if (config.whatsapp_conversations_used >= limits.whatsapp_conversations) {
      return { allowed: false, error: `WhatsApp conversation limit reached.` };
    }
  }
  if (metric === 'automation') {
    if (!limits.automation_enabled) {
      return { allowed: false, error: `Automation is disabled.` };
    }
  }
  return { allowed: true };
}

// Optimized Implementation: Fetches config once, checks limits locally
async function getBillingConfig(shop: string = "global"): Promise<BillingConfig> {
  return await mockKvStore.get(`billing:config:${shop}`);
}

function checkLimitWithConfig(metric: 'ai' | 'whatsapp' | 'automation', config: BillingConfig): { allowed: boolean; error?: string } {
  const limits = PLAN_LIMITS[config.plan];

  if (metric === 'ai') {
    if (config.ai_generations_used >= limits.ai_generations) {
      return { allowed: false, error: `AI generation limit reached.` };
    }
  }
  if (metric === 'whatsapp') {
    if (config.whatsapp_conversations_used >= limits.whatsapp_conversations) {
      return { allowed: false, error: `WhatsApp conversation limit reached.` };
    }
  }
  if (metric === 'automation') {
    if (!limits.automation_enabled) {
      return { allowed: false, error: `Automation is disabled.` };
    }
  }
  return { allowed: true };
}


// --- Benchmark Runner ---

async function runBenchmark() {
  const shop = "benchmark-shop.myshopify.com";
  const iterations = 50;

  console.log(`Running benchmark with ${iterations} iterations...`);
  console.log(`Simulated DB Latency: ${MOCK_DB_LATENCY_MS}ms`);

  // Baseline (Current)
  const startBaseline = performance.now();
  for (let i = 0; i < iterations; i++) {
    // Simulate: checking two limits independently
    await checkLimitCurrent('automation', shop);
    await checkLimitCurrent('whatsapp', shop);
  }
  const endBaseline = performance.now();
  const durationBaseline = endBaseline - startBaseline;

  // Optimized
  const startOptimized = performance.now();
  for (let i = 0; i < iterations; i++) {
    // Simulate: fetch once, check twice
    const config = await getBillingConfig(shop);
    checkLimitWithConfig('automation', config);
    checkLimitWithConfig('whatsapp', config);
  }
  const endOptimized = performance.now();
  const durationOptimized = endOptimized - startOptimized;

  console.log("\n--- Results ---");
  console.log(`Baseline (2 DB calls): ${durationBaseline.toFixed(2)}ms`);
  console.log(`Optimized (1 DB call): ${durationOptimized.toFixed(2)}ms`);
  console.log(`Speedup: ${(durationBaseline / durationOptimized).toFixed(2)}x`);
  console.log(`Average Latency Reduction per Request: ${((durationBaseline - durationOptimized) / iterations).toFixed(2)}ms`);
}

runBenchmark().catch(console.error);
