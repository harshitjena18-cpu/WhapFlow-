import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const integrationsApp = new Hono();

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

// GET /status
integrationsApp.get("/status", async (c) => {
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

// POST /status (For demo/testing purposes)
integrationsApp.post("/status", async (c) => {
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

export default integrationsApp;
