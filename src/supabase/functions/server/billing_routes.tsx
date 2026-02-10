import { Hono } from "npm:hono";
import * as _kv from "./kv_store.tsx";
import * as billing from "./billing.ts";
import { getMerchantCredentials, shopifyGraphql, verifyWebhookHmac } from "./shopify_client.ts";
import { PlanLevel, PLAN_LIMITS } from "./billing.ts";
import { getEnv } from "../../../lib/env.ts";
import { API_DOMAIN, APP_DOMAIN, SERVER_BASE_PATH } from "./constants.ts";

const app = new Hono();

// CONFIG
// In production, use env vars. For now, hardcode or derive.
const APP_URL = APP_DOMAIN;
const _API_URL = `${API_DOMAIN}${SERVER_BASE_PATH}`;

/**
 * GET /api/billing/plans
 * Returns available billing plans with their limits
 */
app.get("/plans", (c) => {
  try {
    return c.json({
      plans: {
        free: {
          name: PLAN_LIMITS.free.name,
          price: PLAN_LIMITS.free.price,
          ai_limit: PLAN_LIMITS.free.ai_generations,
          whatsapp_limit: PLAN_LIMITS.free.whatsapp_conversations,
          automation_enabled: PLAN_LIMITS.free.automation_enabled
        },
        starter: {
          name: PLAN_LIMITS.starter.name,
          price: PLAN_LIMITS.starter.price,
          ai_limit: PLAN_LIMITS.starter.ai_generations,
          whatsapp_limit: PLAN_LIMITS.starter.whatsapp_conversations,
          automation_enabled: PLAN_LIMITS.starter.automation_enabled
        },
        growth: {
          name: PLAN_LIMITS.growth.name,
          price: PLAN_LIMITS.growth.price,
          ai_limit: PLAN_LIMITS.growth.ai_generations,
          whatsapp_limit: PLAN_LIMITS.growth.whatsapp_conversations,
          automation_enabled: PLAN_LIMITS.growth.automation_enabled
        },
        pro: {
          name: PLAN_LIMITS.pro.name,
          price: PLAN_LIMITS.pro.price,
          ai_limit: PLAN_LIMITS.pro.ai_generations,
          whatsapp_limit: PLAN_LIMITS.pro.whatsapp_conversations,
          automation_enabled: PLAN_LIMITS.pro.automation_enabled
        }
      }
    });
  } catch (error) {
    console.error("[Billing] Get Plans Error:", error);
    return c.json({ error: "Failed to fetch plans" }, 500);
  }
});

/**
 * STEP 3: CREATE SUBSCRIPTION (Upgrade Flow)
 * POST /api/billing/create-subscription
 * Body: { plan: "starter" | "growth" | "pro", shop: "example.myshopify.com" }
 */
app.post("/create-subscription", async (c) => {
  try {
    const { plan, shop } = await c.req.json();
    
    if (!plan || !shop) {
      return c.json({ error: "Missing plan or shop" }, 400);
    }
    
    const targetPlan = PLAN_LIMITS[plan as PlanLevel];
    if (!targetPlan || plan === 'free') {
      return c.json({ error: "Invalid plan selected" }, 400);
    }

    // 1. Get Credentials
    const merchant = await getMerchantCredentials(shop);
    if (!merchant || !merchant.access_token) {
      return c.json({ error: "Merchant not found or disconnected" }, 404);
    }

    // 2. Prepare GraphQL Mutation
    const returnUrl = `${APP_URL}/billing/confirm?shop=${shop}&plan=${plan}`;
    // Always use test: true for development/review phase as per instructions
    const isTest = true; 
    
    const mutation = `
      mutation AppSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!, $test: Boolean) {
        appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems, test: $test) {
          userErrors {
            field
            message
          }
          confirmationUrl
          appSubscription {
            id
            status
          }
        }
      }
    `;

    const variables = {
      name: `Whapflow ${targetPlan.name}`,
      returnUrl: returnUrl,
      test: isTest,
      lineItems: [{
        plan: {
          appRecurringPricingDetails: {
            price: {
              amount: targetPlan.price,
              currencyCode: "USD"
            },
            interval: "EVERY_30_DAYS"
          }
        }
      }]
    };

    console.log(`[Billing] Creating subscription for ${shop} to ${plan} ($${targetPlan.price})...`);

    // 3. Call Shopify
    const data = await shopifyGraphql(shop, merchant.access_token, mutation, variables);
    
    const result = data.appSubscriptionCreate;
    
    if (result.userErrors && result.userErrors.length > 0) {
      console.error("[Billing] Shopify Errors:", result.userErrors);
      return c.json({ error: result.userErrors[0].message }, 400);
    }

    // 4. Return Confirmation URL
    return c.json({ 
      confirmationUrl: result.confirmationUrl,
      subscriptionId: result.appSubscription.id
    });

  } catch (error) {
    console.error("[Billing] Create Subscription Error:", error);
    return c.json({ error: error.message || "Failed to create subscription" }, 500);
  }
});

/**
 * STEP 6: BILLING STATUS CHECK
 * GET /api/billing/status?shop=example.myshopify.com
 */
app.get("/status", async (c) => {
  const shop = c.req.query("shop");
  if (!shop) return c.json({ error: "Shop required" }, 400);

  try {
    const merchant = await getMerchantCredentials(shop);
    if (!merchant || !merchant.access_token) {
        // Fallback to free if no credentials
        return c.json({ plan: "free", active: true });
    }

    const query = `
      query {
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
            test
            lineItems {
              plan {
                pricingDetails {
                  ... on AppRecurringPricing {
                    price {
                      amount
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    // PERFORMANCE: Parallelize Shopify API call and local database config fetch
    const [data, currentConfig] = await Promise.all([
      shopifyGraphql(shop, merchant.access_token, query),
      billing.getBillingConfig(shop)
    ]);

    const subscriptions = data.currentAppInstallation.activeSubscriptions;
    
    let activePlan: PlanLevel = 'free';
    let subscriptionId = null;

    if (subscriptions && subscriptions.length > 0) {
      const sub = subscriptions[0];
      subscriptionId = sub.id;
      
      // Infer plan from price
      // This is a simple heuristic. In a complex app, match by 'name' or internal ID.
      const price = parseFloat(sub.lineItems[0].plan.pricingDetails.price.amount);
      
      if (price >= PLAN_LIMITS.pro.price) activePlan = 'pro';
      else if (price >= PLAN_LIMITS.growth.price) activePlan = 'growth';
      else if (price >= PLAN_LIMITS.starter.price) activePlan = 'starter';
    }

    // Sync with database
    if (currentConfig.plan !== activePlan) {
        console.log(`[Billing] Syncing plan for ${shop}: ${currentConfig.plan} -> ${activePlan}`);
        await billing.updatePlan(shop, activePlan, subscriptionId || undefined);
    }

    return c.json({ 
        plan: activePlan, 
        subscription_id: subscriptionId,
        limits: PLAN_LIMITS[activePlan]
    });

  } catch (error) {
    console.error(`[Billing] Status check failed for ${shop}:`, error);
    // Fail-safe: Don't downgrade blindly on error, but report error
    return c.json({ error: "Failed to verify billing status" }, 500);
  }
});

/**
 * STEP 7: SUBSCRIPTION WEBHOOKS
 * POST /api/webhooks/billing/update
 * POST /api/webhooks/billing/cancel
 */

// Helper for Webhook processing
// deno-lint-ignore no-explicit-any
async function processBillingWebhook(c: any, action: 'update' | 'cancel') {
  const hmac = c.req.header('X-Shopify-Hmac-Sha256');
  const shop = c.req.header('X-Shopify-Shop-Domain');
  const rawBody = await c.req.text();
  
  // Security: Verify HMAC
  const secret = getEnv('SHOPIFY_CLIENT_SECRET');
  if (!secret) {
    console.error("[Billing Webhook] Critical Error: SHOPIFY_CLIENT_SECRET not configured");
    return c.json({ error: 'Server configuration error' }, 500);
  }
  if (!hmac) {
    console.error("[Billing Webhook] Missing HMAC header");
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const isValid = await verifyWebhookHmac(rawBody, hmac, secret);
  if (!isValid) {
    console.error(`[Billing Webhook] HMAC verification failed for ${shop}`);
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (!shop) return c.json({ error: 'Missing shop' }, 400);

  const payload = JSON.parse(rawBody);
  const subscription = payload.app_subscription;
  
  console.log(`[Billing Webhook] ${action.toUpperCase()} received for ${shop}`);

  if (action === 'cancel' || (subscription && subscription.status !== 'ACTIVE')) {
     // DOWNGRADE TO FREE
     console.log(`[Billing] Downgrading ${shop} to Free.`);
     await billing.updatePlan(shop, 'free');
  } else if (action === 'update') {
     // Re-verify status to be sure (Webhook might be for a different plan)
     // Or parse payload to find plan. 
     // For safety/simplicity, we trigger a status sync via GraphQL if needed, 
     // OR just accept the plan if we can map it.
     // Let's rely on the payload's price or name if available, otherwise just log.
     // The safest is to treat "update" as a signal to re-check.
     // But wait, we can't call our own GET /status easily from here without credentials.
     // We can update if the payload has clear data.
     
     // Let's try to parse the name: "Whapflow Pro"
     const name = subscription.name;
     let newPlan: PlanLevel = 'free';
     
     if (name.includes('Pro')) newPlan = 'pro';
     else if (name.includes('Growth')) newPlan = 'growth';
     else if (name.includes('Starter')) newPlan = 'starter';
     
     if (newPlan !== 'free') {
         await billing.updatePlan(shop, newPlan, subscription.admin_graphql_api_id);
         console.log(`[Billing] Updated ${shop} to ${newPlan} via Webhook.`);
     }
  }

  return c.json({ status: 'ok' });
}

app.post("/webhooks/billing/update", (c) => processBillingWebhook(c, 'update'));
app.post("/webhooks/billing/cancel", (c) => processBillingWebhook(c, 'cancel'));

export default app;