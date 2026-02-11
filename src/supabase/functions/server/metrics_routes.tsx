import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import * as billing from "./billing.ts";
import { AutomationTemplate } from "./types.ts";
import { sendWhatsAppTemplate } from "./whatsapp.ts";

const metricsApp = new Hono();

// GET /api/dashboard/metrics
metricsApp.get("/api/dashboard/metrics", async (c) => {
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

// GET /api/ai/usage
metricsApp.get("/api/ai/usage", async (c) => {
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

// POST /api/whatsapp/send
metricsApp.post("/api/whatsapp/send", async (c) => {
  try {
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

export default metricsApp;
