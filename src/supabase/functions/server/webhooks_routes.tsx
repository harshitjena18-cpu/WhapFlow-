import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import * as billing from "./billing.ts";
import { getEnv } from "../../../lib/env.ts";
import { verifyWebhookHmac, getMerchantCredentials } from "./shopify_client.ts";
import { encrypt } from "./crypto.ts";
import { scheduleAutomation, processWhatsAppStatuses, AutomationTemplate } from "./automation.ts";
import { verifyWhatsAppSignature } from "./whatsapp.ts";

const webhooksApp = new Hono();

/**
 * Shopify Webhook Receiver (CHECKOUTS)
 * Path: /shopify (mounted at /api/webhooks)
 */
webhooksApp.post("/shopify", async (c) => {
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

    if (!shop) {
        console.error("[Shopify Webhook] Missing Shop Domain header");
        return c.json({ error: 'Missing shop domain' }, 400);
    }

    const payload = JSON.parse(rawBody);

    // 1. PERFORMANCE: Massively parallelize deduplication check, I/O fetching, and PII encryption.
    // This reduces the number of sequential await points from ~6 to 2.
    const customerPhone = payload.customer?.phone || payload.phone || "No phone provided";
    const customerName = payload.customer ? `${payload.customer.first_name} ${payload.customer.last_name}` : "Guest";
    const customerEmail = payload.customer?.email || payload.email || "";

    // PERFORMANCE: Parallelize all independent dependencies and deduplication check.
    // This reduces the number of sequential asynchronous operations in the critical path.
    // We merge the deduplication check into the main mget to further reduce concurrent requests.
    const keysToFetch = [
      `merchant:${shop}`,
      `shop:${shop}:config:whatsapp`,
      `${billing.BILLING_KEY_PREFIX}${shop}`
    ];
    if (webhookId) keysToFetch.push(`webhook_id:${webhookId}`);

    const [configsResult, encryptionResult] = await Promise.all([
      // Batch fetch dependencies and deduplication check to reduce round-trip latency
      Promise.all([
        kv.mget(keysToFetch),
        kv.getByPrefix(`shop:${shop}:template:`)
      ]),

      // SECURITY: Encrypt PII at rest
      Promise.all([
        encrypt(customerName),
        encrypt(customerEmail),
        encrypt(customerPhone)
      ])
    ]);

    const [configs, rawTemplates] = configsResult;
    const [encName, encEmail, encPhone] = encryptionResult;

    const [merchantData, whatsappConfig, preFetchedBilling, dedupCheck] = configs;

    // Check deduplication result
    if (webhookId && dedupCheck) {
      return c.json({ status: 'success', duplicate: true }, 200);
    }

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

    // 3. PERSISTENCE Prep
    const cartId = payload.id ? String(payload.id) : crypto.randomUUID();
    const cartKey = `abandoned_cart:${cartId}`;

    const abandonedCartData = {
      id: cartId,
      shop: shop,
      customer_name: encName,
      customer_email: encEmail,
      phone: encPhone,
      product_title: firstProduct,
      total_price: cartValue,
      currency: currency,
      checkout_url: recoveryUrl,
      status: "pending",
      created_at: new Date().toISOString()
    };

    // PERFORMANCE: Batch all writes (deduplication mark + cart save) in a single request
    const updateKeys = [cartKey];
    const updateValues: any[] = [abandonedCartData];
    if (webhookId) {
      updateKeys.push(`webhook_id:${webhookId}`);
      updateValues.push({ processed_at: new Date().toISOString() });
    }
    await kv.mset(updateKeys, updateValues);

    console.log(`✅ SUCCESS: Cart saved with ID [${cartId}]`);
    console.log('Status: "pending" (Waiting for automation trigger)');
    console.log('-----------------------------------\n');

    // 4. AUTOMATION DELAY: Wait, then check logic

    // CHECK INTEGRATIONS & LIMITS (Parallelized for performance)
    console.log('\n🔍 AUTOMATION CHECKS: Verifying integration status and limits...');


    // Use pre-fetched data to avoid redundant KV round-trips
    const [merchant, billingConfig] = await Promise.all([
      getMerchantCredentials(shop, merchantData),
      billing.getBillingConfig(shop, preFetchedBilling)
    ]);
    const templates = (rawTemplates || []) as AutomationTemplate[];

    // Check if THIS shop is connected
    if (!merchant || !merchant.shopify_connected) {
       console.log(`⏹️ AUTOMATION PAUSED: Merchant ${shop} not connected/active.`);
       return c.json({ status: 'success', received: true, automation: 'paused_merchant_inactive' }, 200);
    }

    // Check WhatsApp Connection
    const whatsappConnected = whatsappConfig?.connection_status === 'connected';
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
 * Path: /app/uninstalled (mounted at /api/webhooks)
 */
webhooksApp.post("/app/uninstalled", async (c) => {
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

    if (!shop) {
        return c.json({ error: 'Missing shop domain' }, 400);
    }

    // 1. Cleanup Merchant Record & Scoped Config (Batched)
    const merchantKey = `merchant:${shop}`;
    const shopifyKey = `shop:${shop}:config:shopify`;

    // PERFORMANCE: Batch merchant validation and deduplication check to reduce round-trip latency
    const keysToBatch = [merchantKey, shopifyKey];
    if (webhookId) keysToBatch.push(`webhook_id:${webhookId}`);

    const configs = await kv.mget(keysToBatch);

    const [merchant, shopifyConfig, alreadyProcessed] = configs;

    const [alreadyProcessed, merchant, shopifyConfig] = configs;

    // SECURITY: Deduplication (Prevent Replay Attacks)
    if (webhookId && alreadyProcessed) {
      return c.json({ status: 'success', duplicate: true }, 200);
    }

    const updateKeys = [];
    const updateValues = [];

    // Mark webhook as processed in the same batch update
    if (webhookId) {
        updateKeys.push(`webhook_id:${webhookId}`);
        updateValues.push({ processed_at: new Date().toISOString() });
    }

    if (merchant) {
        console.log(`[Uninstall] Deactivating merchant record for ${shop}...`);
        merchant.shopify_connected = false;
        merchant.access_token = null; // Security: Clear token
        merchant.updated_at = new Date().toISOString();
        updateKeys.push(merchantKey);
        updateValues.push(merchant);
    }

    if (shopifyConfig) {
        console.log(`[Uninstall] Clearing shop-scoped dashboard config...`);
        shopifyConfig.connection_status = 'disconnected';
        shopifyConfig.connected_at = null;
        updateKeys.push(shopifyKey);
        updateValues.push(shopifyConfig);
    }

    // PERFORMANCE: Batch SETs to reduce round-trips
    if (updateKeys.length > 0) {
        await kv.mset(updateKeys, updateValues);
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

/**
 * WhatsApp Webhook Receiver
 * Path: /whatsapp (mounted at /api/webhooks)
 */
// GET: Verification Challenge
webhooksApp.get("/whatsapp", (c) => {
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");

  const verifyToken = getEnv("WHATSAPP_VERIFY_TOKEN");

  // SECURITY: Ensure verifyToken is configured and matches the request token
  if (mode === "subscribe" && verifyToken && token === verifyToken) {
    console.log("[WhatsApp Webhook] Webhook verified.");
    return c.text(challenge || "");
  }

  console.error("[WhatsApp Webhook] Verification failed.");
  return c.json({ error: "Forbidden" }, 403);
});

// POST: Status Updates & Messages
webhooksApp.post("/whatsapp", async (c) => {
  try {
    const signature = c.req.header("X-Hub-Signature-256");
    const rawBody = await c.req.text();

    // SECURITY: Verify HMAC
    const isValid = await verifyWhatsAppSignature(rawBody, signature || null);
    if (!isValid) {
      console.error("[WhatsApp Webhook] HMAC verification failed");
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = JSON.parse(rawBody);

    // Check if it's a status update
    if (body.entry && body.entry[0]?.changes && body.entry[0]?.changes[0]?.value?.statuses) {
      const statuses = body.entry[0].changes[0].value.statuses;
      // PERFORMANCE: Process all status updates in a single optimized batch
      await processWhatsAppStatuses(statuses);
    }

    return c.json({ status: 'ok' });
  } catch (error) {
    console.error("[WhatsApp Webhook] Error processing POST:", error);
    return c.json({ error: "Internal Error" }, 500);
  }
});

export default webhooksApp;
