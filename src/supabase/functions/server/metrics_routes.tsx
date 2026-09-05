import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import * as billing from "./billing.ts";
import { AutomationTemplate, IntegrationConfig } from "./types.ts";

const app = new Hono();

// GET /api/dashboard/metrics
app.get("/metrics", async (c) => {
  try {
    const shop = c.req.query("shop");
    if (!shop) {
      return c.json({ error: "Missing shop parameter" }, 400);
    }

    // 1. PERFORMANCE: Batch all 4 independent KV key lookups into a single mget request.
    // This reduces DB round-trips by 75% for key lookups on the metrics endpoint.
    const billingKey = `${billing.BILLING_KEY_PREFIX}${shop}`;
    const [configs, rawTemplates] = await Promise.all([
      kv.mget([
        `merchant:${shop}`,
        `shop:${shop}:config:shopify`,
        `shop:${shop}:config:whatsapp`,
        billingKey
      ]),
      kv.getByPrefix(`shop:${shop}:template:`)
    ]);

    const [merchant, shopifyConfig, whatsappConfig, preFetchedBilling] = configs;
    const billingConfig = await billing.getBillingConfig(shop, preFetchedBilling);
    const templates = (rawTemplates || []) as AutomationTemplate[];

    // SECURITY: Verify merchant exists to prevent unauthorized data access
    if (!merchant && shop !== "global") {
      return c.json({ error: "Unauthorized: Merchant not found" }, 401);
    }

    const sConfig = shopifyConfig as IntegrationConfig | null;
    const wConfig = whatsappConfig as IntegrationConfig | null;

    const status = {
      shopify_connected: sConfig?.connection_status === 'connected',
      whatsapp_connected: wConfig?.connection_status === 'connected',
      shopify: sConfig,
      whatsapp: wConfig
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

export default app;
