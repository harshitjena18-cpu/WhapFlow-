import { Hono } from "npm:hono";
import * as billing from "./billing.ts";
import { verifyShopifySession } from "./middleware.ts";
import { getErrorMessage } from "../../../lib/error.ts";

const app = new Hono();

// SECURITY: Apply session verification to all AI routes
app.use("*", verifyShopifySession);

// GET /api/ai/usage
app.get("/usage", async (c) => {
  try {
    // SECURITY: Use verified shop domain from session token (guaranteed by middleware)
    const shop = c.get("verified_shop") as string;
    if (!shop) return c.json({ error: "Shop domain required" }, 400);

    const config = await billing.getBillingConfig(shop);
    const limits = billing.PLAN_LIMITS[config.plan];

    return c.json({
      ai_generations_used: config.ai_generations_used,
      ai_generations_limit: limits.ai_generations,
      ai_usage_reset_at: config.billing_cycle_reset_at
    });
  } catch (error) {
    console.error("Error fetching AI usage:", getErrorMessage(error));
    return c.json({ error: "Failed to fetch usage stats" }, 500);
  }
});

export default app;
