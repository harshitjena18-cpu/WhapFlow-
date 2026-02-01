import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { secureHeaders } from "npm:hono/secure-headers";
import { enqueueJob, processPendingJobs } from "./queue.ts";
import * as kv from "./kv_store.tsx";
import { sendWhatsAppTemplate } from "./whatsapp.ts";
import * as billing from "./billing.ts"; // Import Billing Service
import { checkOrderExists, getMerchantCredentials, verifyWebhookHmac } from "./shopify_client.ts";
import authApp from "./auth.tsx";
import dashboardApp from "./dashboard.tsx";
import shopifyAuthApp from "./shopify_auth.tsx"; // Import Shopify Auth
import billingApp from "./billing_routes.tsx"; // Import Billing Routes

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
  return c.json({ error: "Internal Server Error", message: err.message }, 500);
});

// Mount auth routes
app.route("/make-server-c8eef56a", authApp);
app.route("/make-server-c8eef56a/dashboard", dashboardApp);
app.route("/make-server-c8eef56a/auth/shopify", shopifyAuthApp);
app.route("/make-server-c8eef56a/api/billing", billingApp);

// --- Whapflow API Foundation ---

/**
 * TEMPLATES API
 * Manage WhatsApp Message Templates
 */

// Helper: Ensure only one template is enabled
async function disableOtherTemplates(exceptId: string) {
  const allTemplates = await kv.getByPrefix("template:");
  const updates = [];
  
  for (const t of allTemplates) {
    if (t.id !== exceptId && t.enabled) {
      t.enabled = false;
      updates.push(kv.set(`template:${t.id}`, t));
    }
  }
  
  await Promise.all(updates);
}

// Helper: Validate Template Content
function validateTemplateContent(content: string): string | null {
  if (!content || !content.trim()) return "Content cannot be empty";
  if (content.length > 1024) return "Content exceeds 1024 characters";
  if (!content.includes("{{checkout_link}}")) return "Content must include {{checkout_link}}";
  return null;
}

// Helper: Process WhatsApp Status Updates
async function processWhatsAppStatus(status: any) {
  const wamid = status.id;
  const newStatus = status.status; // sent, delivered, read

  console.log(`[WhatsApp Status] Message ${wamid} is ${newStatus}`);

  // Find the cart associated with this message
  // We need a mapping: msg_map:{wamid} -> cartId
  const cartId = await kv.get(`msg_map:${wamid}`);

  if (!cartId) {
    console.log(`[WhatsApp Status] No cart found for message ${wamid}`);
    return;
  }

  // Update Cart Status
  const cartKey = `abandoned_cart:${cartId}`;
  const cart = await kv.get(cartKey);

  if (cart) {
    cart.delivery_status = newStatus;
    cart.updated_at = new Date().toISOString();
    await kv.set(cartKey, cart);
    console.log(`[WhatsApp Status] Updated cart ${cartId} to ${newStatus}`);
  }
}

// Integration Configurations (Future-proofing)
interface IntegrationConfig {
  connected_at: string | null;
  last_error: string | null;
  connection_status: 'connected' | 'disconnected' | 'error' | 'pending';
  metadata: Record<string, any>;
}

const DEFAULT_CONFIG: IntegrationConfig = {
  connected_at: null,
  last_error: null,
  connection_status: 'disconnected',
  metadata: {}
};

// GET /api/integrations/status
app.get("/make-server-c8eef56a/api/integrations/status", async (c) => {
  try {
    // Fetch detailed configurations
    let shopifyConfig = await kv.get("config:shopify");
    let whatsappConfig = await kv.get("config:whatsapp");

    // Initialize if missing
    if (!shopifyConfig) {
      shopifyConfig = { ...DEFAULT_CONFIG };
      await kv.set("config:shopify", shopifyConfig);
    }
    if (!whatsappConfig) {
      whatsappConfig = { ...DEFAULT_CONFIG };
      await kv.set("config:whatsapp", whatsappConfig);
    }
    
    // Derive simple status for frontend compatibility
    // In future, frontend should read the full config objects
    const status = {
      shopify_connected: shopifyConfig.connection_status === 'connected',
      whatsapp_connected: whatsappConfig.connection_status === 'connected',
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
app.post("/make-server-c8eef56a/api/integrations/status", async (c) => {
  try {
    const body = await c.req.json();
    
    // Update Shopify Config
    if (body.shopify_connected !== undefined) {
      const config: IntegrationConfig = (await kv.get("config:shopify")) || { ...DEFAULT_CONFIG };
      config.connection_status = body.shopify_connected ? 'connected' : 'disconnected';
      config.connected_at = body.shopify_connected ? new Date().toISOString() : null;
      await kv.set("config:shopify", config);
    }

    // Update WhatsApp Config
    if (body.whatsapp_connected !== undefined) {
      const config: IntegrationConfig = (await kv.get("config:whatsapp")) || { ...DEFAULT_CONFIG };
      config.connection_status = body.whatsapp_connected ? 'connected' : 'disconnected';
      config.connected_at = body.whatsapp_connected ? new Date().toISOString() : null;
      await kv.set("config:whatsapp", config);
    }
    
    // Return updated status
    const shopifyConfig = await kv.get("config:shopify");
    const whatsappConfig = await kv.get("config:whatsapp");
    
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
app.get("/make-server-c8eef56a/api/templates", async (c) => {
  try {
    const templates = await kv.getByPrefix("template:");
    // Sort by created_at desc
    templates.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return c.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return c.json({ error: "Failed to fetch templates" }, 500);
  }
});

// POST /api/templates
app.post("/make-server-c8eef56a/api/templates", async (c) => {
  try {
    const body = await c.req.json();
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
    
    // Check uniqueness of template_name
    const existing = await kv.getByPrefix("template:");
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
    
    await kv.set(`template:${id}`, newTemplate);
    return c.json(newTemplate, 201);
  } catch (error) {
    console.error("Error creating template:", error);
    return c.json({ error: "Failed to create template" }, 500);
  }
});

// PUT /api/templates/:id
app.put("/make-server-c8eef56a/api/templates/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existing = await kv.get(`template:${id}`);
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
    
    // If enabling, disable others
    if (body.enabled === true && !existing.enabled) {
      await disableOtherTemplates(id);
    }
    
    await kv.set(`template:${id}`, updated);
    return c.json(updated);
  } catch (error) {
    console.error("Error updating template:", error);
    return c.json({ error: "Failed to update template" }, 500);
  }
});

// DELETE /api/templates/:id
app.delete("/make-server-c8eef56a/api/templates/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`template:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return c.json({ error: "Failed to delete template" }, 500);
  }
});

// GET /api/ai/usage
app.get("/make-server-c8eef56a/api/ai/usage", async (c) => {
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
app.post("/make-server-c8eef56a/api/templates/ai-generate", async (c) => {
  try {
    const body = await c.req.json();
    const { tone, brand_name, discount, shop } = body;

    if (!shop) return c.json({ error: "Shop parameter required" }, 400);

    // 1. Check Billing Limits
    const limitCheck = await billing.checkLimit('ai', shop);
    if (!limitCheck.allowed) {
      console.warn("AI Limit Reached:", limitCheck.error);
      return c.json({ 
        error: limitCheck.error,
        limit_reached: true 
      }, 429);
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");

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
    } catch (e) {
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
    return c.json({ error: error.message || "Failed to generate templates" }, 500);
  }
});


/**
 * Shopify Webhook Receiver (CHECKOUTS)
 * Path: /api/webhooks/shopify
 */
app.post("/make-server-c8eef56a/api/webhooks/shopify", async (c) => {
  try {
    const hmac = c.req.header('X-Shopify-Hmac-Sha256');
    const shop = c.req.header('X-Shopify-Shop-Domain');
    const rawBody = await c.req.text(); 
    
    // SECURITY: Verify HMAC
    const secret = Deno.env.get('SHOPIFY_CLIENT_SECRET');
    if (secret && hmac) {
      const isValid = await verifyWebhookHmac(rawBody, hmac, secret);
      if (!isValid) {
        console.error(`[Shopify Webhook] HMAC verification failed for ${shop}`);
        return c.json({ error: 'Unauthorized' }, 401);
      }
    } else {
        console.warn("[Shopify Webhook] Skipping HMAC check (Missing secret or header)");
    }

    if (!shop) {
        console.error("[Shopify Webhook] Missing Shop Domain header");
        return c.json({ error: 'Missing shop domain' }, 400);
    }

    const payload = JSON.parse(rawBody);
    
    // 1. Log reception
    console.log(`\n--- 🛒 SHOPIFY WEBHOOK RECEIVED [${shop}] ---`);
    console.log('Timestamp:', new Date().toISOString());

    // 2. Extract key data points
    const customerPhone = payload.customer?.phone || payload.phone || "No phone provided";
    const customerName = payload.customer ? `${payload.customer.first_name} ${payload.customer.last_name}` : "Guest";
    const customerEmail = payload.customer?.email || payload.email || "";
    const firstProduct = payload.line_items?.[0]?.title || "Unknown Product";
    const cartValue = payload.total_price || "0.00";
    const currency = payload.currency || "USD";
    const recoveryUrl = payload.abandoned_checkout_url || "No URL";

    // 3. Log extracted data
    console.log('\n📦 DATA EXTRACTED:');
    console.log(`👤 Customer: ${customerName}`);
    console.log(`📱 Phone:    ${customerPhone}`);
    console.log(`🛍️ Product:  ${firstProduct} (and ${payload.line_items?.length - 1 || 0} others)`);
    console.log(`💰 Value:    ${cartValue} ${currency}`);
    console.log(`🔗 Recovery: ${recoveryUrl}`);
    
    // 4. PERSISTENCE: Save to Database
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

    // 5. AUTOMATION DELAY: Wait, then check logic
    
    // CHECK INTEGRATIONS FIRST (Global Check)
    console.log('\n🔍 AUTOMATION CHECKS: Verifying integration status...');
    
    // Check if THIS shop is connected
    const merchant = await getMerchantCredentials(shop);
    if (!merchant || !merchant.shopify_connected) {
       console.log(`⏹️ AUTOMATION PAUSED: Merchant ${shop} not connected/active.`);
       return c.json({ status: 'success', received: true, automation: 'paused_merchant_inactive' }, 200);
    }
    
    // Check WhatsApp Connection
    const whatsappConfig = await kv.get("config:whatsapp");
    const whatsappConnected = whatsappConfig?.connection_status === 'connected';
    
    if (!whatsappConnected) {
      console.log("⏹️ AUTOMATION PAUSED: WhatsApp integration not connected.");
      return c.json({ status: 'success', received: true, automation: 'paused_integrations_missing' }, 200);
    }
    
    // CHECK BILLING / PLAN
    const automationCheck = await billing.checkLimit('automation', shop);
    if (!automationCheck.allowed) {
      console.log(`⏹️ AUTOMATION PAUSED: ${automationCheck.error}`);
      return c.json({ status: 'success', received: true, automation: 'paused_plan_limit' }, 200);
    }
    
    // FETCH ENABLED TEMPLATE
    console.log('\n🔍 AUTOMATION CONFIG: Fetching enabled template...');
    const templates = await kv.getByPrefix("template:");
    const enabledTemplate = templates.find((t: any) => t.enabled);

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
app.post("/make-server-c8eef56a/api/webhooks/app/uninstalled", async (c) => {
  try {
    const hmac = c.req.header('X-Shopify-Hmac-Sha256');
    const shop = c.req.header('X-Shopify-Shop-Domain');
    const rawBody = await c.req.text(); 
    
    console.log(`\n--- ⚠️ APP UNINSTALLED WEBHOOK RECEIVED [${shop}] ---`);

    // SECURITY: Verify HMAC
    const secret = Deno.env.get('SHOPIFY_CLIENT_SECRET');
    if (secret && hmac) {
      const isValid = await verifyWebhookHmac(rawBody, hmac, secret);
      if (!isValid) {
        console.error(`[Uninstall Webhook] HMAC verification failed for ${shop}`);
        return c.json({ error: 'Unauthorized' }, 401);
      }
    } else {
        console.warn("[Uninstall Webhook] Skipping HMAC check (Missing secret or header)");
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

    // 2. Cleanup Global Config (for MVP dashboard compatibility)
    // Only if the uninstalled shop is the one currently in the global config
    const globalConfig = await kv.get("config:shopify");
    if (globalConfig && globalConfig.shop_domain === shop) {
        console.log(`[Uninstall] Clearing global dashboard config...`);
        globalConfig.connection_status = 'disconnected';
        globalConfig.connected_at = null;
        await kv.set("config:shopify", globalConfig);
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
async function scheduleAutomation(payload: any, delayMinutes: number) {
  console.log(`[Automation] Scheduling job for cart ${payload.cartId} in ${delayMinutes} minutes...`);
  await enqueueJob(payload, delayMinutes);
}

// deno-lint-ignore no-explicit-any
async function executeAutomation(payload: any) {
  const { cartId, cartKey, templateName, shop } = payload;
  
  try {
    console.log(`\n⏰ AUTOMATION: Executing job for cart [${cartId}]. Checking logic...`);

      // 1. Re-fetch current state from "Database"
      const currentCart = await kv.get(cartKey);

      if (!currentCart) {
        console.log(`❌ AUTOMATION SKIPPED: Cart [${cartId}] no longer exists.`);
        return;
      }

      // STEP 3: ORDERS API SAFETY CHECK
      // Retrieve merchant credentials
      const merchant = await getMerchantCredentials(shop);
      if (!merchant || !merchant.access_token) {
          console.error(`❌ AUTOMATION FAILED: No credentials found for ${shop}`);
          return;
      }

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
        return; // EXIT
      }

      // Re-confirm automation is enabled (Check if an active template exists)
      // deno-lint-ignore no-explicit-any
      const templates = await kv.getByPrefix("template:");
      // deno-lint-ignore no-explicit-any
      const hasEnabledTemplate = templates.some((t: any) => t.enabled);

      // 2. Check Logic
      const isPending = currentCart.status === 'pending';

    // Re-check Plan Limits
    const billingConfig = await billing.getBillingConfig(shop);
    const automationCheck = billing.checkLimitWithConfig('automation', billingConfig);
    const whatsappCheck = billing.checkLimitWithConfig('whatsapp', billingConfig);

          await kv.set(cartKey, currentCart);

    if (isPending && hasEnabledTemplate && automationCheck.allowed && whatsappCheck.allowed) {
      console.log(`✅ CONDITIONS MET: Ready to send WhatsApp message.`);
      console.log(`   - Automation ready using template: ${templateName}`);
      
      const result = await sendWhatsAppTemplate({
        to: currentCart.phone,
        templateName: templateName,
        languageCode: "en_US"
      });

      if (result.success) {
        // Increment Usage
        await billing.incrementUsage('whatsapp', shop);

        currentCart.status = 'messaged';
        currentCart.messaged_at = new Date().toISOString();

        if (result.wamid) {
             currentCart.wamid = result.wamid;
             await kv.set(`msg_map:${result.wamid}`, cartId);
             console.log(`🔗 Mapped message ${result.wamid} to cart ${cartId}`);
        }

        await kv.set(cartKey, currentCart);

      } else {
        console.log('⏹️ AUTOMATION SKIPPED: Conditions not met (e.g. cart recovered or automation off).');
      }

    } catch (err) {
      console.error('Automation Error:', err);
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
app.post("/make-server-c8eef56a/api/whatsapp/send", async (c) => {
  try {
    const { phoneNumber, templateId } = await c.req.json();
    console.log(`[WhatsApp] Intent to send template "${templateId}" to ${phoneNumber}`);
    
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

  } catch (error) {
    return c.json({ error: 'Invalid request' }, 400);
  }
});

/**
 * WhatsApp Webhook Receiver
 * Path: /app/api/webhooks/whatsapp/route.ts
 */
// GET: Verification Challenge
app.get("/make-server-c8eef56a/api/webhooks/whatsapp", (c) => {
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");

  const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WhatsApp Webhook] Webhook verified.");
    return c.text(challenge || "");
  }

  console.error("[WhatsApp Webhook] Verification failed.");
  return c.json({ error: "Forbidden" }, 403);
});

// POST: Status Updates & Messages
app.post("/make-server-c8eef56a/api/webhooks/whatsapp", async (c) => {
  try {
    const body = await c.req.json();

    // Check if it's a status update
    if (body.entry && body.entry[0]?.changes && body.entry[0]?.changes[0]?.value?.statuses) {
      const statuses = body.entry[0].changes[0].value.statuses;
      // deno-lint-ignore no-explicit-any
      await Promise.all(statuses.map((status: any) => processWhatsAppStatus(status)));
    }

    return c.json({ status: 'ok' });
  } catch (error) {
    console.error("[WhatsApp Webhook] Error processing POST:", error);
    return c.json({ error: "Internal Error" }, 500);
  }
});

// GET /api/dashboard/metrics
app.get("/make-server-c8eef56a/api/dashboard/metrics", async (c) => {
  try {
    const shop = c.req.query("shop") || "global"; // Default to "global" if no shop provided

    // 1. Fetch Integrations Status
    const shopifyConfig = await kv.get("config:shopify");
    const whatsappConfig = await kv.get("config:whatsapp");
    const status = {
      shopify_connected: shopifyConfig?.connection_status === 'connected',
      whatsapp_connected: whatsappConfig?.connection_status === 'connected'
    };
    
    // 2. Fetch Templates Stats
    const templates = await kv.getByPrefix("template:");
    const templatesCount = templates.length;
    // deno-lint-ignore no-explicit-any
    const hasEnabledTemplate = templates.some((t: any) => t.enabled);
    
    // 3. Fetch AI Usage & Billing
    const billingConfig = await billing.getBillingConfig(shop);
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
app.get("/make-server-c8eef56a/health", (c) => {
  return c.json({ status: "ok" });
});

Deno.serve(app.fetch);