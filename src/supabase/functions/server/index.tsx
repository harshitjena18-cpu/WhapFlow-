import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { secureHeaders } from "npm:hono/secure-headers";
import { enqueueJob, processPendingJobs } from "./queue.ts";
import { encrypt, decrypt } from "./crypto.ts";
import * as kv from "./kv_store.tsx";
import { sendWhatsAppTemplate } from "./whatsapp.ts";
import * as billing from "./billing.ts"; // Import Billing Service
import { BILLING_KEY_PREFIX } from "./billing.ts";
import { checkOrderExists, getMerchantCredentials, verifyWebhookHmac } from "./shopify_client.ts";
import authApp from "./auth.tsx";
import dashboardApp from "./dashboard.tsx";
import shopifyAuthApp from "./shopify_auth.tsx"; // Import Shopify Auth
import billingApp from "./billing_routes.tsx"; // Import Billing Routes
import { getEnv } from "../../../lib/env.ts";
import { SERVER_BASE_PATH, SHOPIFY_DOMAIN_REGEX } from "./constants.ts";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable Secure Headers
app.use('*', secureHeaders());

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Shopify-Access-Token", "X-Shopify-Hmac-Sha256", "X-Shopify-Shop-Domain", "X-Shopify-Topic"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Global Error Handler
app.onError((err, c) => {
  console.error("🔥 Global Error Handler:", err);
  // SECURITY: Do not leak internal error messages to the client
  return c.json({ error: "Internal Server Error" }, 500);
});

// Mount Routes
app.route(SERVER_BASE_PATH, authApp);
app.route(`${SERVER_BASE_PATH}/dashboard`, dashboardApp);
app.route(`${SERVER_BASE_PATH}/auth/shopify`, shopifyAuthApp);
app.route(`${SERVER_BASE_PATH}/api/billing`, billingApp);

// --- Whapflow API Foundation ---

/**

interface WhatsAppStatus {
  id: string;
  status: string;
}

interface AutomationTemplate {
  id: string;
  template_name: string;
  display_name: string;
  delay_minutes: number;
  content: string;
  generated_by_ai: boolean;
  ai_tone?: string | null;
  enabled: boolean;
  created_at: string;
}
 * TEMPLATES API
 * Manage WhatsApp Message Templates
 */

// Helper: Ensure only one template is enabled for a specific shop
async function disableOtherTemplates(exceptId: string, shop: string = "global") {
  // SECURITY: Scoping by shop prevents cross-merchant template disabling
  const prefix = `shop:${shop}:template:`;

  // PERFORMANCE: Fetch only enabled templates using DB-side filtering to avoid full table scan
  // This reduces memory usage and network transfer compared to fetching all templates
  const enabledTemplates = await kv.getByPrefixAndValue(prefix, "value->enabled", true);

  const updateKeys = [];
  const updateValues = [];
  
  for (const t of enabledTemplates) {
    // Only process if it's not the one we want to keep enabled
    if (t.id !== exceptId) {
      t.enabled = false;
      updateKeys.push(`${prefix}${t.id}`);
      updateValues.push(t);
    }
  }
  
  if (updateKeys.length > 0) {
    // PERFORMANCE: Batch update all templates in a single request
    await kv.mset(updateKeys, updateValues);
  }
}

// Helper: Validate Template Content
function validateTemplateContent(content: string): string | null {
  if (!content || !content.trim()) return "Content cannot be empty";
  if (content.length > 1024) return "Content exceeds 1024 characters";
  if (!content.includes("{{checkout_link}}")) return "Content must include {{checkout_link}}";
  return null;
}

// Helper: WhatsApp Status Interface
interface WhatsAppStatus {
  id: string;
  status: string;
  timestamp?: string;
  recipient_id?: string;
  conversation?: {
    id: string;
    origin: {
      type: string;
    }
  };
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
  errors?: unknown[];
}

// Helper: Process WhatsApp Status Updates in Batch
async function processWhatsAppStatuses(statuses: WhatsAppStatus[]) {
  if (statuses.length === 0) return;

  const wamids = statuses.map(s => s.id);
  const msgMapKeys = wamids.map(id => `msg_map:${id}`);

  // PERFORMANCE: Batch fetch all cart ID mappings in a single request
  const cartIds = await kv.mget(msgMapKeys);

  const validUpdates: { cartId: string, newStatus: string }[] = [];
  const cartKeys: string[] = [];

  for (let i = 0; i < statuses.length; i++) {
    const cartId = cartIds[i];
    const wamid = statuses[i].id;
    const newStatus = statuses[i].status;

    if (cartId) {
      validUpdates.push({ cartId, newStatus });
      cartKeys.push(`abandoned_cart:${cartId}`);
      console.log(`[WhatsApp Status] Message ${wamid} (${newStatus}) linked to cart ${cartId}`);
    } else {
      console.log(`[WhatsApp Status] No cart found for message ${wamid}`);
    }
  }

  if (cartKeys.length === 0) return;

  // PERFORMANCE: Batch fetch all associated carts in a single request
  const carts = await kv.mget(cartKeys);

  const updateKeys: string[] = [];
  const updateValues: any[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < validUpdates.length; i++) {
    const cart = carts[i];
    if (cart) {
      cart.delivery_status = validUpdates[i].newStatus;
      cart.updated_at = now;
      updateKeys.push(`abandoned_cart:${validUpdates[i].cartId}`);
      updateValues.push(cart);
      console.log(`[WhatsApp Status] Prepared update for cart ${validUpdates[i].cartId} status: ${validUpdates[i].newStatus}`);
    }
  }

  // PERFORMANCE: Batch persist all updated carts in a single request
  if (updateKeys.length > 0) {
    await kv.mset(updateKeys, updateValues);
    console.log(`[WhatsApp Status] Successfully persisted ${updateKeys.length} cart updates.`);
  }
}

// Integration Configurations (Future-proofing)
interface IntegrationConfig {
  connected_at: string | null;
  last_error: string | null;
  connection_status: 'connected' | 'disconnected' | 'error' | 'pending';
  metadata: Record<string, unknown>;
}

const DEFAULT_CONFIG: IntegrationConfig = {
  connected_at: null,
  last_error: null,
  connection_status: 'disconnected',
  metadata: {}
};

// GET /api/integrations/status
app.get(`${SERVER_BASE_PATH}/api/integrations/status`, async (c) => {
  try {
    const shop = c.req.query("shop") || "global";
    // SECURITY: Scoping configurations by shop to prevent multi-tenancy leaks
    const shopifyKey = `shop:${shop}:config:shopify`;
    const whatsappKey = `shop:${shop}:config:whatsapp`;

    // PERFORMANCE: Fetch configurations in a single batch to reduce round-trip latency
    let [shopifyConfig, whatsappConfig] = await kv.mget([
      shopifyKey,
      whatsappKey
    ]);

    // Initialize if missing
    const initialKeys = [];
    const initialValues = [];
    if (!shopifyConfig) {
      shopifyConfig = { ...DEFAULT_CONFIG };
      initialKeys.push(shopifyKey);
      initialValues.push(shopifyConfig);
    }
    if (!whatsappConfig) {
      whatsappConfig = { ...DEFAULT_CONFIG };
      initialKeys.push(whatsappKey);
      initialValues.push(whatsappConfig);
    }

    if (initialKeys.length > 0) {
      await kv.mset(initialKeys, initialValues);
    }
    
    // Derive simple status for frontend compatibility
    // In future, frontend should read the full config objects
    const status = {
      shopify_connected: shopifyConfig.connection_status === 'connected',
      whatsapp_connected: whatsappConfig.connection_status === 'connected',
      shopify: shopifyConfig,
      whatsapp: whatsappConfig,
      shopify_config: shopifyConfig,
      whatsapp_config: whatsappConfig
    };
    
    return c.json(status);
  } catch (error) {
    console.error("Error fetching integration status:", error);
    return c.json({ error: "Failed to fetch status" }, 500);
  }
});

// POST /api/integrations/status (For demo/testing purposes)
app.post(`${SERVER_BASE_PATH}/api/integrations/status`, async (c) => {
  try {
    const body = await c.req.json();
    const shop = body.shop || c.req.query("shop") || "global";
    
    // SECURITY: Scoping configurations by shop to prevent multi-tenancy leaks
    const shopifyKey = `shop:${shop}:config:shopify`;
    const whatsappKey = `shop:${shop}:config:whatsapp`;

    // PERFORMANCE: Fetch both configs in a single batch to minimize latency
    let [shopifyConfig, whatsappConfig] = await kv.mget([
      shopifyKey,
      whatsappKey
    ]);

    const updateKeys = [];
    const updateValues = [];
    const now = new Date().toISOString();

    // Update Shopify Config
    if (body.shopify_connected !== undefined) {
      shopifyConfig = shopifyConfig || { ...DEFAULT_CONFIG };
      shopifyConfig.connection_status = body.shopify_connected ? 'connected' : 'disconnected';
      shopifyConfig.connected_at = body.shopify_connected ? now : null;
      updateKeys.push(shopifyKey);
      updateValues.push(shopifyConfig);
    }

    // Update WhatsApp Config
    if (body.whatsapp_connected !== undefined) {
      whatsappConfig = whatsappConfig || { ...DEFAULT_CONFIG };
      whatsappConfig.connection_status = body.whatsapp_connected ? 'connected' : 'disconnected';
      whatsappConfig.connected_at = body.whatsapp_connected ? now : null;
      updateKeys.push(whatsappKey);
      updateValues.push(whatsappConfig);
    }
    
    // PERFORMANCE: Persist all updates in a single batch request
    if (updateKeys.length > 0) {
      await kv.mset(updateKeys, updateValues);
    }
    
    // PERFORMANCE: Return updated state directly from memory instead of re-fetching from KV
    return c.json({
      shopify_connected: shopifyConfig?.connection_status === 'connected',
      whatsapp_connected: whatsappConfig?.connection_status === 'connected',
      shopify_config: shopifyConfig,
      whatsapp_config: whatsappConfig
    });
  } catch (error) {
    console.error("Error updating integration status:", error);
    return c.json({ error: "Failed to update status" }, 500);
  }
});

// GET /api/templates
app.get(`${SERVER_BASE_PATH}/api/templates`, async (c) => {
  try {
    const shop = c.req.query("shop") || "global";
    // SECURITY: Validate shop domain
    if (shop !== "global" && !SHOPIFY_DOMAIN_REGEX.test(shop)) {
      return c.json({ error: "Invalid shop domain" }, 400);
    }
    // SECURITY: Scoping templates by shop to prevent multi-tenancy leaks
    const templates = await kv.getByPrefix(`shop:${shop}:template:`);
    // Sort by created_at desc
    templates.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return c.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return c.json({ error: "Failed to fetch templates" }, 500);
  }
});

// POST /api/templates
app.post(`${SERVER_BASE_PATH}/api/templates`, async (c) => {
  try {
    const body = await c.req.json();
    const shop = body.shop || c.req.query("shop") || "global";
    // SECURITY: Validate shop domain
    if (shop !== "global" && !SHOPIFY_DOMAIN_REGEX.test(shop)) {
      return c.json({ error: "Invalid shop domain" }, 400);
    }
    const { template_name, display_name, delay_minutes } = body;
    
    if (!template_name || !display_name) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Validate Content
    const content = body.content || "";
    const validationError = validateTemplateContent(content);
    if (validationError) {
      return c.json({ error: validationError }, 400);
    }
    
    // Check uniqueness of template_name within THIS shop
    const prefix = `shop:${shop}:template:`;
    const existing = await kv.getByPrefix(prefix);
    if (existing.some(t => t.template_name === template_name)) {
      return c.json({ error: "Template name must be unique" }, 400);
    }
    
    const id = crypto.randomUUID();
    const newTemplate = {
      id,
      template_name,
      display_name,
      delay_minutes: delay_minutes || 30,
      content,
      generated_by_ai: body.generated_by_ai || false,
      ai_tone: body.ai_tone || null,
      enabled: false, // Default to disabled
      created_at: new Date().toISOString()
    };
    
    await kv.set(`${prefix}${id}`, newTemplate);
    return c.json(newTemplate, 201);
  } catch (error) {
    console.error("Error creating template:", error);
    return c.json({ error: "Failed to create template" }, 500);
  }
});

// PUT /api/templates/:id
app.put(`${SERVER_BASE_PATH}/api/templates/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const shop = body.shop || c.req.query("shop") || "global";
    
    // SECURITY: Validate shop domain to prevent IDOR attacks
    if (shop !== "global" && !SHOPIFY_DOMAIN_REGEX.test(shop)) {
      return c.json({ error: "Invalid shop domain" }, 400);
    }

    const key = `shop:${shop}:template:${id}`;
    const existing = await kv.get(key);
    if (!existing) {
      return c.json({ error: "Template not found" }, 404);
    }
    
    // Validate Content if it's being updated
    if (body.content !== undefined) {
      const validationError = validateTemplateContent(body.content);
      if (validationError) {
        return c.json({ error: validationError }, 400);
      }
    }

    // Update fields
    const updated = { ...existing, ...body };
    
    // If enabling, disable others for THIS shop
    if (body.enabled === true && !existing.enabled) {
      await disableOtherTemplates(id, shop);
    }
    
    await kv.set(key, updated);
    return c.json(updated);
  } catch (error) {
    console.error("Error updating template:", error);
    return c.json({ error: "Failed to update template" }, 500);
  }
});

// DELETE /api/templates/:id
app.delete(`${SERVER_BASE_PATH}/api/templates/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const shop = c.req.query("shop") || "global";

    // SECURITY: Validate shop domain to prevent IDOR attacks
    if (shop !== "global" && !SHOPIFY_DOMAIN_REGEX.test(shop)) {
      return c.json({ error: "Invalid shop domain" }, 400);
    }

    await kv.del(`shop:${shop}:template:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return c.json({ error: "Failed to delete template" }, 500);
  }
});

// GET /api/ai/usage
app.get(`${SERVER_BASE_PATH}/api/ai/usage`, async (c) => {
  try {
    const shop = c.req.query("shop");
    if (!shop) return c.json({ error: "Shop parameter required" }, 400);

    const config = await billing.getBillingConfig(shop);
    const limits = billing.PLAN_LIMITS[config.plan];
    
    return c.json({
      ai_generations_used: config.ai_generations_used,
      ai_generations_limit: limits.ai_generations,
      ai_usage_reset_at: config.billing_cycle_reset_at
    });
  } catch (error) {
    console.error("Error fetching AI usage:", error);
    return c.json({ error: "Failed to fetch usage stats" }, 500);
  }
});

// POST /api/templates/ai-generate
app.post(`${SERVER_BASE_PATH}/api/templates/ai-generate`, async (c) => {
  try {
    const body = await c.req.json();
    const { tone, brand_name, discount, shop } = body;

    // SECURITY: Validate shop domain and presence
    if (!shop || !SHOPIFY_DOMAIN_REGEX.test(shop)) {
      return c.json({ error: "Invalid or missing shop parameter" }, 400);
    }

    // SECURITY: Simple Rate Limiting (Prevent OpenAI credit exhaustion)
    const ip = c.req.header("x-forwarded-for") || "anonymous";
    const currentHour = new Date().toISOString().slice(0, 13);
    const rateKey = `rate_limit:ai_gen:${shop}:${ip}:${currentHour}`;
    const hits = (await kv.get(rateKey) || 0) as number;
    if (hits >= 10) { // Limit to 10 generations per hour per shop/ip
      return c.json({ error: "Rate limit exceeded. Please try again later." }, 429);
    }
    await kv.set(rateKey, hits + 1);

    // 1. Check Billing Limits
    const limitCheck = await billing.checkLimit('ai', shop);
    if (!limitCheck.allowed) {
      console.warn("AI Limit Reached:", limitCheck.error);
      return c.json({ 
        error: limitCheck.error,
        limit_reached: true 
      }, 429);
    }

    const apiKey = getEnv("OPENAI_API_KEY");

    if (!apiKey) {
      return c.json({ error: "OpenAI API key not configured" }, 500);
    }

    const systemPrompt = `You are an expert WhatsApp marketing copywriter.
Write abandoned cart reminder messages for an eCommerce store.

Rules:
- Use the selected tone: ${tone || 'Friendly'}
- Be polite and conversion-focused
- Avoid spammy language
- Keep message under WhatsApp limits (1024 chars, but aim for <300)
- Include a clear call-to-action
- Do NOT promise unrealistic offers
- Do NOT use excessive emojis
- Format the output as a JSON array of strings, e.g. ["message 1", "message 2"]

Use placeholders only:
{{customer_name}}
{{product_name}}
{{checkout_link}}

Context:
Brand Name: ${brand_name || 'Our Store'}
Discount Offer: ${discount || 'None'}

Generate 3 different variations.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate the templates now." }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("OpenAI Error:", data.error);
      throw new Error(data.error.message);
    }

    // Increment Usage
    await billing.incrementUsage('ai', shop);
    
    // Get updated config for response
    const config = await billing.getBillingConfig(shop);
    const limits = billing.PLAN_LIMITS[config.plan];
    
    const content = data.choices[0].message.content;
    let suggestions;
    try {
        // Handle case where AI returns { "templates": [...] } or just the array
        const parsed = JSON.parse(content);
        suggestions = Array.isArray(parsed) ? parsed : (parsed.templates || parsed.messages || []);
    } catch (_e) {
        console.error("Failed to parse AI response:", content);
        return c.json({ error: "Failed to parse AI suggestions" }, 500);
    }

    return c.json({ 
      suggestions, 
      usage: {
        ai_generations_used: config.ai_generations_used,
        ai_generations_limit: limits.ai_generations
      } 
    }); // Return updated usage to frontend

  } catch (error) {
    console.error("Error generating templates:", error);
    // SECURITY: Do not leak internal OpenAI or Database errors to the client
    return c.json({ error: "An error occurred while generating templates. Please try again." }, 500);
  }
});


/**
 * Shopify Webhook Receiver (CHECKOUTS)
 * Path: /api/webhooks/shopify
 */
app.post(`${SERVER_BASE_PATH}/api/webhooks/shopify`, async (c) => {
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

    // SECURITY: Encrypt PII at rest
    const [encName, encEmail, encPhone] = await Promise.all([
      encrypt(customerName),
      encrypt(customerEmail),
      encrypt(customerPhone)
    ]);

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

    // Using the persistent KV store to simulate an 'abandoned_carts' table
    await kv.set(cartKey, abandonedCartData);
    
    console.log(`✅ SUCCESS: Cart saved with ID [${cartId}]`);
    console.log('Status: "pending" (Waiting for automation trigger)');
    console.log('-----------------------------------\n');

    // 4. AUTOMATION DELAY: Wait, then check logic
    
    // CHECK INTEGRATIONS & LIMITS (Parallelized for performance)
    console.log('\n🔍 AUTOMATION CHECKS: Verifying integration status and limits...');
    
    const [merchant, whatsappConfig, billingConfig, rawTemplates] = await Promise.all([
      getMerchantCredentials(shop),
      kv.get(`shop:${shop}:config:whatsapp`),
      billing.getBillingConfig(shop),
      kv.getByPrefix(`shop:${shop}:template:`)
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
 * Path: /api/webhooks/app/uninstalled
 */
app.post(`${SERVER_BASE_PATH}/api/webhooks/app/uninstalled`, async (c) => {
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
    
    if (merchant) {
        console.log(`[Uninstall] Deactivating merchant record for ${shop}...`);
        merchant.shopify_connected = false;
        merchant.access_token = null; // Security: Clear token
        merchant.updated_at = new Date().toISOString();
        
        await kv.set(merchantKey, merchant);
    }

    // 2. Cleanup Scoped Config (Scoping by shop to prevent multi-tenancy leaks)
    const shopifyKey = `shop:${shop}:config:shopify`;
    const shopifyConfig = await kv.get(shopifyKey);
    if (shopifyConfig) {
        console.log(`[Uninstall] Clearing shop-scoped dashboard config...`);
        shopifyConfig.connection_status = 'disconnected';
        shopifyConfig.connected_at = null;
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

/**
 * AUTOMATION ENGINE
 */

interface AutomationPayload {
  cartId: string;
  cartKey: string;
  templateName: string;
  shop: string;
}

interface AutomationTemplate {
  id: string;
  template_name: string;
  display_name: string;
  delay_minutes: number;
  content: string;
  generated_by_ai: boolean;
  ai_tone?: string | null;
  enabled: boolean;
  created_at: string;
}

async function scheduleAutomation(payload: AutomationPayload, delayMinutes: number) {
  console.log(`[Automation] Scheduling job for cart ${payload.cartId} in ${delayMinutes} minutes...`);
  await enqueueJob(payload, delayMinutes);
}

async function executeAutomation(payload: AutomationPayload) {
  const { cartId, cartKey, templateName, shop } = payload;
  
  try {
    console.log(`\n⏰ AUTOMATION: Executing job for cart [${cartId}]. Checking logic...`);

    // Fetch all required data in parallel to minimize latency and fix variable access order
    const [currentCart, merchant, rawTemplates, billingConfig] = await Promise.all([
      kv.get(cartKey),
      getMerchantCredentials(shop),
      kv.getByPrefix(`shop:${shop}:template:`),
      billing.getBillingConfig(shop)
    ]);
    const templates = (rawTemplates || []) as AutomationTemplate[];

    if (!currentCart) {
      console.log(`❌ AUTOMATION SKIPPED: Cart [${cartId}] no longer exists.`);
      return;
    }

    // SECURITY: Decrypt PII before use
    const [name, email, phone] = await Promise.all([
      decrypt(currentCart.customer_name),
      decrypt(currentCart.customer_email),
      decrypt(currentCart.phone)
    ]);
    currentCart.customer_name = name;
    currentCart.customer_email = email;
    currentCart.phone = phone;

    if (!merchant || !merchant.access_token) {
      console.error(`❌ AUTOMATION FAILED: No credentials found for ${shop}`);
      return;
    }

    // 1. Pre-checks (Status & Plan)
    const isPending = currentCart.status === 'pending';
    const hasEnabledTemplate = (templates as AutomationTemplate[]).some(t => t.enabled);
    const automationCheck = billing.checkLimitWithConfig('automation', billingConfig);
    const whatsappCheck = billing.checkLimitWithConfig('whatsapp', billingConfig);

    if (!isPending || !hasEnabledTemplate || !automationCheck.allowed || !whatsappCheck.allowed) {
      console.log('⏹️ AUTOMATION SKIPPED: Pre-conditions not met (e.g. cart already messaged, automation off, or limit reached).');
      return;
    }

    // 2. Orders API Safety Check (Preventing spam if already converted)
    console.log(`   - API CHECK: Checking if order exists for ${shop}...`);
    const orderExists = await checkOrderExists(
        shop,
        merchant.access_token,
        currentCart.created_at,
        currentCart.customer_email,
        currentCart.phone
    );

    if (orderExists) {
      console.log(`⏹️ AUTOMATION SKIPPED: Order found for cart ${cartId}.`);
      currentCart.status = 'converted';
      currentCart.converted_at = new Date().toISOString();
      await kv.set(cartKey, currentCart);
      return;
    }

    // 3. Final Execution
    if (isPending && hasEnabledTemplate && automationCheck.allowed && whatsappCheck.allowed) {
      console.log(`✅ CONDITIONS MET: Ready to send WhatsApp message.`);
      console.log(`   - Automation ready using template: ${templateName}`);
      
      const result = await sendWhatsAppTemplate({
        to: currentCart.phone,
        templateName: templateName,
        languageCode: "en_US"
      });

      if (result.success) {
        // PERFORMANCE: Batch all updates (Billing, Message Map, Cart) in a single request
        const updateKeys = [];
        const updateValues = [];

        // 1. Increment Usage (manually since we already have the config)
        billingConfig.whatsapp_conversations_used += 1;
        updateKeys.push(`${BILLING_KEY_PREFIX}${shop}`);
        updateValues.push(billingConfig);

        // 2. Update Cart Status
        currentCart.status = 'messaged';
        currentCart.messaged_at = new Date().toISOString();

        if (result.wamid) {
             currentCart.wamid = result.wamid;
             // 3. Map message ID to cart for status tracking
             updateKeys.push(`msg_map:${result.wamid}`);
             updateValues.push(cartId);
             console.log(`🔗 Mapped message ${result.wamid} to cart ${cartId}`);
        }

        updateKeys.push(cartKey);
        updateValues.push(currentCart);

        // Atomic batch update
        await kv.mset(updateKeys, updateValues);
        console.log(`⚡ [Automation] Optimized: Persisted ${updateKeys.length} updates in a single batch.`);

      } else {
        console.error(`❌ AUTOMATION FAILED: WhatsApp API Error for cart ${cartId}`, result.error);
        currentCart.status = 'failed';
        currentCart.last_error = result.error;
        await kv.set(cartKey, currentCart);
      }
    }

  } catch (err) {
    console.error(`❌ CRITICAL AUTOMATION ERROR for cart ${cartId}:`, err);
    try {
      // Attempt to record failure state so the job isn't silently lost
      const cart = await kv.get(cartKey);
      if (cart) {
        cart.status = 'failed';
        cart.last_error = String(err);
        await kv.set(cartKey, cart);
      }
    } catch (_e) { /* Ignore secondary storage error */ }
  }
}

// Process Queue periodically
Deno.cron("Process Queue", "* * * * *", async () => {
    await processPendingJobs(executeAutomation);
});

/**
 * WhatsApp Sender
 * Path: /app/api/whatsapp/send/route.ts (Simulated)
 */
app.post(`${SERVER_BASE_PATH}/api/whatsapp/send`, async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const shop = c.req.query("shop") || "global";

    // SECURITY: Protect demo endpoint from unauthorized use
    // Verify against service role key for internal/admin access
    const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceKey || !authHeader || authHeader !== `Bearer ${serviceKey}`) {
      return c.json({ error: "Unauthorized: Invalid or missing token" }, 401);
    }

    // SECURITY: Validate shop domain
    if (shop !== "global" && !SHOPIFY_DOMAIN_REGEX.test(shop)) {
      return c.json({ error: "Invalid shop domain" }, 400);
    }

    const { phoneNumber, templateId } = await c.req.json();
    // SECURITY: Redact phoneNumber from logs
    console.log(`[WhatsApp] Intent to send template "${templateId}" to [REDACTED]`);
    
    // Call the shared helper
    const result = await sendWhatsAppTemplate({
      to: phoneNumber,
      templateName: templateId || "abandoned_cart_test",
      languageCode: "en_US"
    });
    
    if (result.success) {
      return c.json({ success: true, message: 'Message sent', data: result.data }, 200);
    } else {
      return c.json({ error: 'WhatsApp API Error', details: result.error }, 500);
    }

  } catch (_error) {
    return c.json({ error: 'Invalid request' }, 400);
  }
});

/**
 * WhatsApp Webhook Receiver
 * Path: /app/api/webhooks/whatsapp/route.ts
 */
// GET: Verification Challenge
app.get(`${SERVER_BASE_PATH}/api/webhooks/whatsapp`, (c) => {
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
app.post(`${SERVER_BASE_PATH}/api/webhooks/whatsapp`, async (c) => {
  try {
    const body = await c.req.json();

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

// GET /api/dashboard/metrics
app.get(`${SERVER_BASE_PATH}/api/dashboard/metrics`, async (c) => {
  try {
    const shop = c.req.query("shop");
    if (!shop) {
      return c.json({ error: "Missing shop parameter" }, 400);
    }

    // 1. PERFORMANCE: Fetch all dependencies including merchant in parallel to minimize round-trip latency
    const [merchant, shopifyConfig, whatsappConfig, rawTemplates, billingConfig] = await Promise.all([
      kv.get(`merchant:${shop}`),
      kv.get(`shop:${shop}:config:shopify`),
      kv.get(`shop:${shop}:config:whatsapp`),
      kv.getByPrefix(`shop:${shop}:template:`),
      billing.getBillingConfig(shop)
    ]);
    const templates = (rawTemplates || []) as AutomationTemplate[];

    // SECURITY: Verify merchant exists to prevent unauthorized data access
    if (!merchant && shop !== "global") {
      return c.json({ error: "Unauthorized: Merchant not found" }, 401);
    }

    const status = {
      shopify_connected: shopifyConfig?.connection_status === 'connected',
      whatsapp_connected: whatsappConfig?.connection_status === 'connected',
      shopify: shopifyConfig,
      whatsapp: whatsappConfig
    };
    
    // 2. Derive Stats
    const templatesCount = templates.length;
    const hasEnabledTemplate = (templates as AutomationTemplate[]).some(t => t.enabled);
    
    // 3. Billing Context
    const limits = billing.PLAN_LIMITS[billingConfig.plan];
    
    // 4. Determine Automation Status
    // Automation is only active if integrations are connected AND a template is enabled AND plan allows it
    const integrationsConnected = status.shopify_connected && status.whatsapp_connected;
    
    let automationStatus = "active";
    let automationReason = "Running";
    
    if (!integrationsConnected) {
      automationStatus = "paused";
      automationReason = "Integrations not connected";
    } else if (!hasEnabledTemplate) {
      automationStatus = "paused";
      automationReason = "No active template";
    } else if (!limits.automation_enabled) {
      automationStatus = "paused";
      automationReason = `Disabled on ${limits.name} plan`;
    }

    return c.json({
      readiness: {
        templates: {
          total: templatesCount,
          has_enabled: hasEnabledTemplate
        },
        billing: {
          plan: billingConfig.plan,
          plan_name: limits.name,
          ai_usage: {
            used: billingConfig.ai_generations_used,
            limit: limits.ai_generations
          },
          whatsapp_usage: {
            used: billingConfig.whatsapp_conversations_used,
            limit: limits.whatsapp_conversations
          },
          automation_enabled: limits.automation_enabled,
          billing_cycle_reset_at: billingConfig.billing_cycle_reset_at
        },
        // Legacy support for frontend that expects 'ai_usage' at root
        ai_usage: {
          used: billingConfig.ai_generations_used,
          limit: limits.ai_generations
        },
        integrations: status,
        automation: {
          status: automationStatus,
          reason: automationReason
        }
      }
    });

  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return c.json({ error: "Failed to fetch dashboard metrics" }, 500);
  }
});

// Health check endpoint
app.get(`${SERVER_BASE_PATH}/health`, (c) => {
  return c.json({ status: "ok" });
});

Deno.serve(app.fetch);
