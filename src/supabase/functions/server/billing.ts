/**
 * Billing Service (Future-proof Pricing Model)
 * Handles plan limits, usage tracking, and billing resets.
 */

import * as kv from "./kv_store.tsx";

// --- Types ---

export type PlanLevel = 'free' | 'starter' | 'growth' | 'pro';

export interface PlanLimits {
  ai_generations: number;
  whatsapp_conversations: number;
  automation_enabled: boolean;
  name: string;
  price: number; // Added price
}

export interface BillingConfig {
  plan: PlanLevel;
  ai_generations_used: number;
  whatsapp_conversations_used: number;
  billing_cycle_reset_at: string; // ISO Date
  subscription_id?: string; // Store Shopify Subscription ID
}

// --- Configuration ---

export const PLAN_LIMITS: Record<PlanLevel, PlanLimits> = {
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

const BILLING_KEY_PREFIX = "billing:config:";

// --- Methods ---

/**
 * Get current billing config, performing a lazy reset if needed.
 * Supports multi-tenancy via 'shop' parameter. 
 * Falls back to global key if shop is not provided (legacy/admin support).
 */
export async function getBillingConfig(shop: string = "global"): Promise<BillingConfig> {
  const key = `${BILLING_KEY_PREFIX}${shop}`;
  let config = await kv.get(key) as BillingConfig | null;

  // Initialize if missing
  if (!config) {
    config = {
      plan: 'free',
      ai_generations_used: 0,
      whatsapp_conversations_used: 0,
      billing_cycle_reset_at: getNextMonthDate()
    };
    await kv.set(key, config);
  }

  // Lazy Reset Check
  if (new Date() > new Date(config.billing_cycle_reset_at)) {
    console.log(`🔄 BILLING: Resetting monthly usage limits for ${shop}...`);
    config.ai_generations_used = 0;
    config.whatsapp_conversations_used = 0;
    config.billing_cycle_reset_at = getNextMonthDate();
    await kv.set(key, config);
  }

  return config;
}

/**
 * Update the billing plan (e.g. after upgrade).
 */
export async function updatePlan(shop: string, newPlan: PlanLevel, subscriptionId?: string): Promise<BillingConfig> {
  const config = await getBillingConfig(shop);
  config.plan = newPlan;
  if (subscriptionId) {
    config.subscription_id = subscriptionId;
  }
  await kv.set(`${BILLING_KEY_PREFIX}${shop}`, config);
  return config;
}

/**
 * Increment usage for a specific metric.
 * Returns updated config.
 */
export async function incrementUsage(metric: 'ai' | 'whatsapp', shop: string = "global"): Promise<BillingConfig> {
  const config = await getBillingConfig(shop);
  
  if (metric === 'ai') {
    config.ai_generations_used += 1;
  } else if (metric === 'whatsapp') {
    config.whatsapp_conversations_used += 1;
  }
  
  await kv.set(`${BILLING_KEY_PREFIX}${shop}`, config);
  return config;
}

/**
 * Check if an operation is allowed under current plan limits.
 */
export async function checkLimit(metric: 'ai' | 'whatsapp' | 'automation', shop: string = "global"): Promise<{ allowed: boolean; error?: string }> {
  const config = await getBillingConfig(shop);
  const limits = PLAN_LIMITS[config.plan];

  if (metric === 'ai') {
    if (config.ai_generations_used >= limits.ai_generations) {
      return { allowed: false, error: `AI generation limit reached for ${limits.name} plan.` };
    }
  }

  if (metric === 'whatsapp') {
    if (config.whatsapp_conversations_used >= limits.whatsapp_conversations) {
      return { allowed: false, error: `WhatsApp conversation limit reached for ${limits.name} plan.` };
    }
  }

  if (metric === 'automation') {
    if (!limits.automation_enabled) {
      return { allowed: false, error: `Automation is disabled on the ${limits.name} plan. Upgrade to enable.` };
    }
  }

  return { allowed: true };
}

// --- Helpers ---

function getNextMonthDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}
