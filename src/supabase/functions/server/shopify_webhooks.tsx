import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import * as billing from "./billing.ts";
import { getEnv } from "../../../lib/env.ts";
import { getMerchantCredentials, verifyWebhookHmac } from "./shopify_client.ts";
import { scheduleAutomation } from "./automation.ts";
import { AutomationTemplate } from "./types.ts";

const app = new Hono();

// POST /api/webhooks/shopify
app.post("/shopify", async (c) => {
  try {
    const hmac = c.req.header('X-Shopify-Hmac-Sha256');
    const shop = c.req.header('X-Shopify-Shop-Domain');
    const webhookId = c.req.header('X-Shopify-Webhook-Id');
    const rawBody = await c.req.text();

    // SECURITY: Verify HMAC
    const secret = getEnv('SHOPIFY_CLIENT_SECRET');
    if (!secret) {
      console.error("[Shopify Webhook] Critical Error: SHOPIFY_CLIENT_SECRET not configured");
      return c.json({ error: 'Server configuration error' }, 500);
    }
    if (!hmac) {
      console.error("[Shopify Webhook] Missing HMAC header");
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const isValid = await verifyWebhookHmac(rawBody, hmac, secret);
    if (!isValid) {
      console.error(`[Shopify Webhook] HMAC verification failed for ${shop}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // SECURITY: Deduplication (Prevent Replay Attacks)
    // Only perform deduplication AFTER successful HMAC verification to prevent DoS via KV resource exhaustion
    if (webhookId) {
      const alreadyProcessed = await kv.get(`webhook_id:${webhookId}`);
      if (alreadyProcessed) {
        console.log(`[Shopify Webhook] Skipping duplicate webhook ${webhookId} for ${shop}`);
        return c.json({ status: 'success', duplicate: true }, 200);
      }
      await kv.set(`webhook_id:${webhookId}`, { processed_at: new Date().toISOString() });
    }

    if (!shop) {
        console.error("[Shopify Webhook] Missing Shop Domain header");
        return c.json({ error: 'Missing shop domain' }, 400);
    }

    const payload = JSON.parse(rawBody);

    // 1. Extract key data points
    const customerPhone = payload.customer?.phone || payload.phone || "No phone provided";
    const customerName = payload.customer ? `${payload.customer.first_name} ${payload.customer.last_name}` : "Guest";
    const customerEmail = payload.customer?.email || payload.email || "";
    const firstProduct = payload.line_items?.[0]?.title || "Unknown Product";
    const cartValue = payload.total_price || "0.00";
    const currency = payload.currency || "USD";
    const recoveryUrl = payload.abandoned_checkout_url || "No URL";

    // 2. Log reception (Structured & Redacted)
    console.log(`[Shopify Webhook] Received for ${shop}`, {
      timestamp: new Date().toISOString(),
      product: `${firstProduct} (+${Math.max(0, (payload.line_items?.length || 0) - 1)} others)`,
      value: `${cartValue} ${currency}`,
    });
    // 3. PERSISTENCE: Save to Database
    console.log('\n💾 PERSISTENCE: Saving abandoned cart to database...');

    const cartId = payload.id ? String(payload.id) : crypto.randomUUID();
    const cartKey = `abandoned_cart:${cartId}`;

    const abandonedCartData = {
      id: cartId,
      shop: shop, // CRITICAL: Link cart to store
      customer_name: customerName,
      customer_email: customerEmail,
      phone: customerPhone,
      product_title: firstProduct,
      total_price: cartValue,
      currency: currency,
      checkout_url: recoveryUrl,
      status: "pending",
      created_at: new Date().toISOString()
    };

    // Using the persistent KV store to simulate an 'abandoned_carts' table
    await kv.set(cartKey, abandonedCartData);

    console.log(`✅ SUCCESS: Cart saved with ID [${cartId}]`);
    console.log('Status: "pending" (Waiting for automation trigger)');
    console.log('-----------------------------------\n');

    // 4. AUTOMATION DELAY: Wait, then check logic

    // CHECK INTEGRATIONS & LIMITS (Parallelized for performance)
    console.log('\n🔍 AUTOMATION CHECKS: Verifying integration status and limits...');

    // Need to cast rawTemplates to correct type, as getByPrefix returns unknown[]
    const [merchant, whatsappConfig, billingConfig, rawTemplates] = await Promise.all([
      getMerchantCredentials(shop),
      kv.get(`shop:${shop}:config:whatsapp`),
      billing.getBillingConfig(shop),
      kv.getByPrefix(`shop:${shop}:template:`)
    ]);
    const templates = (rawTemplates || []) as AutomationTemplate[];

    // Check if THIS shop is connected
    // deno-lint-ignore no-explicit-any
    if (!merchant || !(merchant as any).shopify_connected) {
       console.log(`⏹️ AUTOMATION PAUSED: Merchant ${shop} not connected/active.`);
       return c.json({ status: 'success', received: true, automation: 'paused_merchant_inactive' }, 200);
    }

    // Check WhatsApp Connection
    // deno-lint-ignore no-explicit-any
    const whatsappConnected = (whatsappConfig as any)?.connection_status === 'connected';
    if (!whatsappConnected) {
      console.log("⏹️ AUTOMATION PAUSED: WhatsApp integration not connected.");
      return c.json({ status: 'success', received: true, automation: 'paused_integrations_missing' }, 200);
    }

    // CHECK BILLING / PLAN
    const automationCheck = billing.checkLimitWithConfig('automation', billingConfig);
    if (!automationCheck.allowed) {
      console.log(`⏹️ AUTOMATION PAUSED: ${automationCheck.error}`);
      return c.json({ status: 'success', received: true, automation: 'paused_plan_limit' }, 200);
    }

    // FETCH ENABLED TEMPLATE
    const enabledTemplate = (templates as AutomationTemplate[]).find(t => t.enabled);

    if (!enabledTemplate) {
        console.log("⏹️ AUTOMATION SKIPPED: No enabled template found.");
        // Do NOT start delay timer
    } else {
        console.log(`✅ TEMPLATE FOUND: ${enabledTemplate.display_name} (${enabledTemplate.template_name})`);
        console.log(`   - Delay: ${enabledTemplate.delay_minutes} minutes`);
        await scheduleAutomation({ cartId, cartKey, templateName: enabledTemplate.template_name, shop }, enabledTemplate.delay_minutes);
    }

    return c.json({ status: 'success', received: true }, 200);

  } catch (error) {
    console.error('[Shopify Webhook] Error processing payload:', error);
    return c.json({ error: 'Invalid payload' }, 400);
  }
});

/**
 * Shopify Webhook Receiver (APP UNINSTALL)
 * Path: /api/webhooks/app/uninstalled
 */
app.post("/app/uninstalled", async (c) => {
  try {
    const hmac = c.req.header('X-Shopify-Hmac-Sha256');
    const shop = c.req.header('X-Shopify-Shop-Domain');
    const webhookId = c.req.header('X-Shopify-Webhook-Id');
    const rawBody = await c.req.text();

    console.log(`\n--- ⚠️ APP UNINSTALLED WEBHOOK RECEIVED [${shop}] ---`);

    // SECURITY: Verify HMAC
    const secret = getEnv('SHOPIFY_CLIENT_SECRET');
    if (!secret) {
      console.error("[Uninstall Webhook] Critical Error: SHOPIFY_CLIENT_SECRET not configured");
      return c.json({ error: 'Server configuration error' }, 500);
    }
    if (!hmac) {
      console.error("[Uninstall Webhook] Missing HMAC header");
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const isValid = await verifyWebhookHmac(rawBody, hmac, secret);
    if (!isValid) {
      console.error(`[Uninstall Webhook] HMAC verification failed for ${shop}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // SECURITY: Deduplication (Prevent Replay Attacks)
    // Only perform deduplication AFTER successful HMAC verification to prevent DoS via KV resource exhaustion
    if (webhookId) {
      const alreadyProcessed = await kv.get(`webhook_id:${webhookId}`);
      if (alreadyProcessed) {
        console.log(`[Uninstall Webhook] Skipping duplicate webhook ${webhookId} for ${shop}`);
        return c.json({ status: 'success', duplicate: true }, 200);
      }
      await kv.set(`webhook_id:${webhookId}`, { processed_at: new Date().toISOString() });
    }

    if (!shop) {
        return c.json({ error: 'Missing shop domain' }, 400);
    }

    // 1. Cleanup Merchant Record
    const merchantKey = `merchant:${shop}`;
    const merchant = await kv.get(merchantKey);

    // deno-lint-ignore no-explicit-any
    if (merchant) {
        console.log(`[Uninstall] Deactivating merchant record for ${shop}...`);
        // deno-lint-ignore no-explicit-any
        (merchant as any).shopify_connected = false;
        // deno-lint-ignore no-explicit-any
        (merchant as any).access_token = null; // Security: Clear token
        // deno-lint-ignore no-explicit-any
        (merchant as any).updated_at = new Date().toISOString();

        await kv.set(merchantKey, merchant);
    }

    // 2. Cleanup Scoped Config (Scoping by shop to prevent multi-tenancy leaks)
    const shopifyKey = `shop:${shop}:config:shopify`;
    const shopifyConfig = await kv.get(shopifyKey);
    // deno-lint-ignore no-explicit-any
    if (shopifyConfig) {
        console.log(`[Uninstall] Clearing shop-scoped dashboard config...`);
        // deno-lint-ignore no-explicit-any
        (shopifyConfig as any).connection_status = 'disconnected';
        // deno-lint-ignore no-explicit-any
        (shopifyConfig as any).connected_at = null;
        await kv.set(shopifyKey, shopifyConfig);
    }

    // 3. Cleanup: We don't delete carts immediately for analytics,
    // but future automations will fail because merchant.shopify_connected is false.

    console.log(`[Uninstall] Cleanup complete for ${shop}.`);
    return c.json({ status: 'success' }, 200);

  } catch (error) {
    console.error('[Uninstall Webhook] Error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

export default app;
