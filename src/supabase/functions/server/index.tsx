import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { sendWhatsAppTemplate } from "./whatsapp.ts";
import authApp from "./auth.tsx";
import dashboardApp from "./dashboard.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Mount auth routes
app.route("/make-server-c8eef56a", authApp);
app.route("/make-server-c8eef56a/dashboard", dashboardApp);

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
    // For this MVP, we use a global/single tenant key. 
    // In production, you would use `const userId = c.get('userId')` or similar.
    const USAGE_KEY = "ai_usage:global"; 
    
    let usage = await kv.get(USAGE_KEY);
    
    // Initialize if not exists
    if (!usage) {
      usage = {
        ai_generations_used: 0,
        ai_generations_limit: 20,
        ai_usage_reset_at: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
      };
      await kv.set(USAGE_KEY, usage);
    }
    
    // Check for monthly reset
    if (new Date() > new Date(usage.ai_usage_reset_at)) {
      usage.ai_generations_used = 0;
      usage.ai_usage_reset_at = new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString();
      await kv.set(USAGE_KEY, usage);
    }

    return c.json(usage);
  } catch (error) {
    console.error("Error fetching AI usage:", error);
    return c.json({ error: "Failed to fetch usage stats" }, 500);
  }
});

// POST /api/templates/ai-generate
app.post("/make-server-c8eef56a/api/templates/ai-generate", async (c) => {
  try {
    // 1. Check Usage Limits
    const USAGE_KEY = "ai_usage:global";
    let usage = await kv.get(USAGE_KEY);
    
    // Initialize defaults if missing
    if (!usage) {
      usage = {
        ai_generations_used: 0,
        ai_generations_limit: 20, // Free tier limit
        ai_usage_reset_at: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
      };
      await kv.set(USAGE_KEY, usage);
    }

    // Reset logic (redundant safety check)
    if (new Date() > new Date(usage.ai_usage_reset_at)) {
      usage.ai_generations_used = 0;
      usage.ai_usage_reset_at = new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString();
      await kv.set(USAGE_KEY, usage);
    }

    // Enforce Limit
    if (usage.ai_generations_used >= usage.ai_generations_limit) {
      console.warn("AI Limit Reached for user");
      return c.json({ 
        error: "AI generation limit reached. Please upgrade your plan or wait for the monthly reset.",
        limit_reached: true 
      }, 429);
    }

    const { tone, brand_name, discount } = await c.req.json();
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
    usage.ai_generations_used += 1;
    await kv.set(USAGE_KEY, usage);

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

    return c.json({ suggestions, usage }); // Return updated usage to frontend

  } catch (error) {
    console.error("Error generating templates:", error);
    return c.json({ error: error.message || "Failed to generate templates" }, 500);
  }
});


/**
 * Shopify Webhook Receiver
 * Path: /app/api/webhooks/shopify/route.ts (Simulated)
 * 
 * CONCEPT: What is a Webhook?
 * A webhook is like a "reverse phone call". Instead of Whapflow calling Shopify every minute 
 * to ask "Are there any new abandoned carts?" (Polling/Pulling), Shopify calls us immediately 
 * when an event happens (Pushing).
 * 
 * WHY PUSH VS PULL?
 * - Real-time: We know about the abandoned cart the second it happens.
 * - Efficient: We don't waste resources checking for data that hasn't changed.
 * 
 * FUTURE AUTOMATION FLOW:
 * 1. Shopify detects a user left checkout -> Sends data here.
 * 2. We verify the "Checkouts/Create" or "Checkouts/Update" event.
 * 3. We save the cart to our database.
 * 4. A background job waits (e.g., 15 mins).
 * 5. If no purchase is made, we trigger the WhatsApp message.
 */
app.post("/make-server-c8eef56a/api/webhooks/shopify", async (c) => {
  try {
    // TODO: Verify Shopify Webhook HMAC
    // const hmac = c.req.header('X-Shopify-Hmac-Sha256');
    // const body = await c.req.text(); // Need raw body for HMAC
    // if (!verifyShopifyHmac(hmac, body, Deno.env.get('SHOPIFY_API_SECRET'))) {
    //   return c.json({ error: 'Unauthorized' }, 401);
    // }

    const payload = await c.req.json();
    
    // 1. Log reception
    console.log('\n--- 🛒 SHOPIFY WEBHOOK RECEIVED ---');
    console.log('Timestamp:', new Date().toISOString());

    // 2. Extract key data points
    const customerPhone = payload.customer?.phone || payload.phone || "No phone provided";
    const customerName = payload.customer ? `${payload.customer.first_name} ${payload.customer.last_name}` : "Guest";
    const firstProduct = payload.line_items?.[0]?.title || "Unknown Product";
    const cartValue = payload.total_price || "0.00";
    const currency = payload.currency || "USD";
    const recoveryUrl = payload.abandoned_checkout_url || "No URL";

    // 3. Log extracted data
    console.log('\n📦 DATA EXTRACTED:');
    console.log(`👤 Customer: ${customerName}`);
    console.log(`���� Phone:    ${customerPhone}`);
    console.log(`🛍️ Product:  ${firstProduct} (and ${payload.line_items?.length - 1 || 0} others)`);
    console.log(`💰 Value:    ${cartValue} ${currency}`);
    console.log(`🔗 Recovery: ${recoveryUrl}`);
    
    // 4. PERSISTENCE: Save to Database
    // CONCEPT: Why save before sending?
    // - Reliability: If the WhatsApp API is down, we don't lose the customer. We can retry later.
    // - Analytics: We need to count how many carts were abandoned vs recovered over time.
    // - Context: We need to know "who" to message when the automation timer triggers.
    
    console.log('\n💾 PERSISTENCE: Saving abandoned cart to database...');
    
    const cartId = payload.id ? String(payload.id) : crypto.randomUUID();
    const cartKey = `abandoned_cart:${cartId}`;
    
    const abandonedCartData = {
      id: cartId,
      customer_name: customerName,
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
    // We fire and forget the automation process so we can return 200 to Shopify immediately.
    
    // CHECK INTEGRATIONS FIRST
    console.log('\n🔍 AUTOMATION CHECKS: Verifying integration status...');
    const shopifyConfig = await kv.get("config:shopify");
    const whatsappConfig = await kv.get("config:whatsapp");
    const shopifyConnected = shopifyConfig?.connection_status === 'connected';
    const whatsappConnected = whatsappConfig?.connection_status === 'connected';
    
    if (!shopifyConnected || !whatsappConnected) {
      console.log("⏹️ AUTOMATION PAUSED: Integrations not connected.");
      console.log(`   - Shopify: ${shopifyConnected}`);
      console.log(`   - WhatsApp: ${whatsappConnected}`);
      return c.json({ status: 'success', received: true, automation: 'paused_integrations_missing' }, 200);
    }
    
    // FETCH ENABLED TEMPLATE
    // CONCEPT: Configuration Driven Automation
    // Instead of hardcoding logic, we look up the merchant's settings.
    // This allows the merchant to change the delay or template without changing code.
    console.log('\n🔍 AUTOMATION CONFIG: Fetching enabled template...');
    const templates = await kv.getByPrefix("template:");
    const enabledTemplate = templates.find((t: any) => t.enabled);

    if (!enabledTemplate) {
        console.log("⏹️ AUTOMATION SKIPPED: No enabled template found.");
        // Do NOT start delay timer
    } else {
        console.log(`✅ TEMPLATE FOUND: ${enabledTemplate.display_name} (${enabledTemplate.template_name})`);
        console.log(`   - Delay: ${enabledTemplate.delay_minutes} minutes`);
        triggerAutomationDelay(cartId, cartKey, enabledTemplate.delay_minutes, enabledTemplate.template_name);
    }
    
    return c.json({ status: 'success', received: true }, 200);

  } catch (error) {
    console.error('[Shopify Webhook] Error processing payload:', error);
    return c.json({ error: 'Invalid payload' }, 400);
  }
});

/**
 * AUTOMATION ENGINE (MVP Version)
 * 
 * CONCEPT: Why use a delay?
 * Users who just abandoned a cart might return in 5 minutes to finish it. 
 * Sending a message immediately feels spammy and intrusive.
 * A 30-minute delay is the industry standard "sweet spot" to recover carts 
 * without annoying customers.
 * 
 * CONCEPT: Why re-check status?
 * In the 30 minutes since the webhook arrived, the user might have:
 * - Completed the purchase (status should change to 'recovered')
 * - Cancelled the order
 * We must check the database for the *latest* truth before sending.
 */
async function triggerAutomationDelay(cartId: string, cartKey: string, delayMinutes: number, templateName: string) {
  // CONFIGURATION
  // In a real production app, use a Job Queue (like Supabase pg_cron or QStash).
  // For this MVP/Demo, we use setTimeout.
  
  // Dynamic Delay
  const DELAY_MS = delayMinutes * 60 * 1000; 
  
  console.log(`\n⏳ AUTOMATION: Starting ${delayMinutes} minute timer for cart [${cartId}]...`);
  
  setTimeout(async () => {
    try {
      console.log(`\n⏰ AUTOMATION: Timer finished for cart [${cartId}]. Checking logic...`);
      
      // 1. Re-fetch current state from "Database"
      const currentCart = await kv.get(cartKey);
      
      if (!currentCart) {
        console.log(`❌ AUTOMATION SKIPPED: Cart [${cartId}] no longer exists.`);
        return;
      }
      
      // 2. Check Logic
      const isPending = currentCart.status === 'pending';
      
      // TODO: Check if cart was converted to order via Shopify API
      // const orderId = await checkShopifyOrder(currentCart.checkout_token, shopifyConfig);
      // if (orderId) {
      //   console.log(`⏹️ AUTOMATION SKIPPED: Order ${orderId} completed.`);
      //   currentCart.status = 'recovered';
      //   await kv.set(cartKey, currentCart);
      //   return;
      // }
      
      // Re-confirm automation is enabled (Check if an active template exists)
      // Why? The user might have disabled automation while the timer was running.
      const templates = await kv.getByPrefix("template:");
      const hasEnabledTemplate = templates.some((t: any) => t.enabled);
      
      console.log(`   - Current Status: ${currentCart.status}`);
      console.log(`   - Automation Enabled: ${hasEnabledTemplate}`);
      
      if (isPending && hasEnabledTemplate) {
        console.log(`✅ CONDITIONS MET: Ready to send WhatsApp message.`);
        console.log(`   - Automation ready using template: ${templateName}`);
        
        // 3. EXECUTE: Send WhatsApp Message
        // TODO: Replace with real WhatsApp Cloud API call
        // const whatsappClient = new WhatsAppClient(whatsappConfig.metadata.token);
        // await whatsappClient.sendTemplate(currentCart.phone, templateName);
        
        const result = await sendWhatsAppTemplate({
          to: currentCart.phone,
          templateName: templateName, 
          languageCode: "en_US"
        });

        if (result.success) {
          // 4. UPDATE STATUS: Prevent duplicate messages
          // CONCEPT: Idempotency
          // We mark this cart as 'messaged' so even if this logic runs again, 
          // the 'isPending' check will fail, protecting the user from spam.
          currentCart.status = 'messaged';
          currentCart.messaged_at = new Date().toISOString();
          await kv.set(cartKey, currentCart);
          
          console.log(`🚀 AUTOMATION SUCCESS: Message sent to ${currentCart.phone}`);
          console.log(`📝 Status updated to "messaged"`);
        } else {
          console.error(`⚠️ AUTOMATION FAILED: WhatsApp API error`, result.error);
          // We keep status as 'pending' so we might retry later (not implemented in MVP)
        }

      } else {
        console.log('⏹️ AUTOMATION SKIPPED: Conditions not met (e.g. cart recovered or automation off).');
      }
      
    } catch (err) {
      console.error('Automation Error:', err);
    }
  }, DELAY_MS);
}

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
 * Path: /app/api/webhooks/whatsapp/route.ts (Future)
 */
app.post("/make-server-c8eef56a/api/webhooks/whatsapp", async (c) => {
  // TODO: Handle WhatsApp Webhook verification (GET challenge)
  // if (c.req.query('hub.mode') === 'subscribe' && c.req.query('hub.verify_token') === VERIFY_TOKEN) {
  //   return c.text(c.req.query('hub.challenge'));
  // }

  // TODO: Handle WhatsApp Delivery Status (sent, delivered, read)
  // const payload = await c.req.json();
  // processWhatsAppStatus(payload);

  return c.json({ status: 'ok' });
});

// GET /api/dashboard/metrics
app.get("/make-server-c8eef56a/api/dashboard/metrics", async (c) => {
  try {
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
    const hasEnabledTemplate = templates.some((t: any) => t.enabled);
    
    // 3. Fetch AI Usage
    const USAGE_KEY = "ai_usage:global"; 
    let aiUsage = await kv.get(USAGE_KEY);
    if (!aiUsage) {
      aiUsage = { ai_generations_used: 0, ai_generations_limit: 20 };
    }

    // 4. Determine Automation Status
    // Automation is only active if integrations are connected AND a template is enabled
    // But per instructions: "Active (only if both integrations connected)"
    const integrationsConnected = status.shopify_connected && status.whatsapp_connected;
    const automationStatus = integrationsConnected ? "active" : "paused";
    const automationReason = !integrationsConnected ? "Integrations not connected" : (!hasEnabledTemplate ? "No active template" : "Running");

    return c.json({
      readiness: {
        templates: {
          total: templatesCount,
          has_enabled: hasEnabledTemplate
        },
        ai_usage: {
          used: aiUsage.ai_generations_used,
          limit: aiUsage.ai_generations_limit
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