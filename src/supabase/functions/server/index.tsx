import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { secureHeaders } from "npm:hono/secure-headers";
import { processPendingJobs } from "./queue.ts";
import { executeAutomation, processWhatsAppStatuses } from "./automation.ts";
import { getEnv } from "../../../lib/env.ts";
import { getErrorMessage } from "../../../lib/error.ts";
import { secureCompare } from "./crypto.ts";

import authApp from "./auth.tsx";
import dashboardApp from "./dashboard.tsx";
import dashboardMetricsApp from "./dashboard_metrics.tsx";
import shopifyAuthApp from "./shopify_auth.tsx";
import billingApp from "./billing_routes.tsx";
import templatesApp from "./templates_routes.tsx";
import integrationsApp from "./integrations_routes.tsx";
import webhooksApp from "./webhooks_routes.tsx";
import whatsappApp from "./whatsapp_routes.tsx";
import aiApp from "./ai_routes.tsx";

import { SERVER_BASE_PATH, SHOPIFY_DOMAIN_REGEX, APP_DOMAIN, API_DOMAIN, LOCALHOST_REGEX } from "./constants.ts";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable Secure Headers
app.use('*', secureHeaders());

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: (origin) => {
      // Allow requests with no origin (e.g. mobile apps, curl)
      if (!origin) return origin;

      // Localhost for development (Strict regex validation)
      if (LOCALHOST_REGEX.test(origin)) {
        return origin;
      }

      // Production frontend
      if (origin === APP_DOMAIN) {
        return origin;
      }

      // Allow API domain if it calls itself
      if (origin === API_DOMAIN) {
        return origin;
      }

      // Block others
      return undefined;
    },
    allowHeaders: ["Content-Type", "Authorization", "X-Shopify-Access-Token", "X-Shopify-Hmac-Sha256", "X-Shopify-Shop-Domain", "X-Shopify-Topic"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Global Error Handler
app.onError((err, c) => {
  // SECURITY: Redact PII from error messages before logging
  console.error("🔥 Global Error Handler:", getErrorMessage(err));
  // SECURITY: Do not leak internal error messages to the client
  return c.json({ error: "Internal Server Error" }, 500);
});

// Mount Routes
app.route(SERVER_BASE_PATH, authApp);
app.route(`${SERVER_BASE_PATH}/dashboard`, dashboardApp);
app.route(`${SERVER_BASE_PATH}/api/dashboard`, dashboardMetricsApp);
app.route(`${SERVER_BASE_PATH}/auth/shopify`, shopifyAuthApp);
app.route(`${SERVER_BASE_PATH}/api/billing`, billingApp);
app.route(`${SERVER_BASE_PATH}/api/integrations`, integrationsApp);
app.route(`${SERVER_BASE_PATH}/api/templates`, templatesApp);
app.route(`${SERVER_BASE_PATH}/api/webhooks`, webhooksApp);

// New Routes
app.route(`${SERVER_BASE_PATH}/api/whatsapp`, whatsappApp);
app.route(`${SERVER_BASE_PATH}/api/ai`, aiApp);

// Health check endpoint
app.get(`${SERVER_BASE_PATH}/health`, (c) => {
  return c.json({ status: "ok" });
});

// Process Queue periodically
Deno.cron("Process Queue", "* * * * *", async () => {
    await processPendingJobs(executeAutomation);
});


if (import.meta.main) {
  Deno.serve(app.fetch);
}

export default app;
