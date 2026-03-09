import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { DEFAULT_CONFIG } from "./types.ts";
import { verifyShopifySession } from "./middleware.ts";
import { getErrorMessage } from "../../../lib/error.ts";

const app = new Hono();

// SECURITY: Apply session verification to all integration routes
app.use("*", verifyShopifySession);

// GET /api/integrations/status
app.get("/status", async (c) => {
  try {
    // SECURITY: Use verified shop domain from session token (guaranteed by middleware)
    const shop = c.get("verified_shop") as string;
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
    console.error("Error fetching integration status:", getErrorMessage(error));
    return c.json({ error: "Failed to fetch status" }, 500);
  }
});

// POST /api/integrations/status (For demo/testing purposes)
app.post("/status", async (c) => {
  try {
    const body = await c.req.json();
    // SECURITY: Use verified shop domain from session token (guaranteed by middleware)
    const shop = c.get("verified_shop") as string;

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
    console.error("Error updating integration status:", getErrorMessage(error));
    return c.json({ error: "Failed to update status" }, 500);
  }
});

export default app;
