import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { secureHeaders } from "npm:hono/secure-headers";
import { processPendingJobs } from "./queue.ts";
import { executeAutomation } from "./automation.ts";

// Route Modules
import authApp from "./auth.tsx";
import dashboardApp from "./dashboard.tsx";
import shopifyAuthApp from "./shopify_auth.tsx";
import billingApp from "./billing_routes.tsx";
import whatsappRoutes from "./whatsapp_routes.tsx";
import metricsRoutes from "./metrics_routes.tsx";
import integrationsRoutes from "./integrations_routes.tsx";
import templatesRoutes from "./templates_routes.tsx";
import aiRoutes from "./ai_routes.tsx";
import shopifyWebhooks from "./shopify_webhooks.tsx";

import { SERVER_BASE_PATH } from "./constants.ts";

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

// New Routes
app.route(`${SERVER_BASE_PATH}/api`, whatsappRoutes); // /whatsapp/send, /webhooks/whatsapp
app.route(`${SERVER_BASE_PATH}/api/dashboard`, metricsRoutes); // /metrics
app.route(`${SERVER_BASE_PATH}/api/integrations`, integrationsRoutes); // /status
app.route(`${SERVER_BASE_PATH}/api/templates`, templatesRoutes); // /, /:id, /ai-generate
app.route(`${SERVER_BASE_PATH}/api/ai`, aiRoutes); // /usage
app.route(`${SERVER_BASE_PATH}/api/webhooks`, shopifyWebhooks); // /shopify, /app/uninstalled

// Health check endpoint
app.get(`${SERVER_BASE_PATH}/health`, (c) => {
  return c.json({ status: "ok" });
});

// Process Queue periodically
Deno.cron("Process Queue", "* * * * *", async () => {
    await processPendingJobs(executeAutomation);
});

Deno.serve(app.fetch);
