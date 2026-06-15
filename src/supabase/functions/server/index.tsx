import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { secureHeaders } from "npm:hono/secure-headers";
import { processPendingJobs } from "./queue.ts";
import { executeAutomation, processWhatsAppStatuses } from "./automation.ts";
import { getEnv } from "../../../lib/env.ts";
import { getErrorMessage } from "../../../lib/error.ts";
import { secureCompare } from "./crypto.ts";
import { sendWhatsAppTemplate, verifyWhatsAppSignature } from "./whatsapp.ts";

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

/**
 * WhatsApp Sender
 * Path: /api/whatsapp/send
 */
app.post(`${SERVER_BASE_PATH}/api/whatsapp/send`, async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const shop = c.req.query("shop") || "global";

    // SECURITY: Protect demo endpoint from unauthorized use
    const whatsappApiKey = getEnv("WHATSAPP_API_KEY");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const isWhatsappAuth = whatsappApiKey && secureCompare(authHeader, `Bearer ${whatsappApiKey}`);
    const isServiceAuth = serviceRoleKey && secureCompare(authHeader, `Bearer ${serviceRoleKey}`);

    if (!isWhatsappAuth && !isServiceAuth) {
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
 * GET: Verification Challenge
 */
app.get(`${SERVER_BASE_PATH}/api/webhooks/whatsapp`, (c) => {
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");

  const verifyToken = getEnv("WHATSAPP_VERIFY_TOKEN");

  // SECURITY: Use secureCompare to prevent timing attacks on the verify token
  if (mode === "subscribe" && verifyToken && secureCompare(token, verifyToken)) {
    console.log("[WhatsApp Webhook] Webhook verified.");
    return c.text(challenge || "");
  }

  console.error("[WhatsApp Webhook] Verification failed.");
  return c.json({ error: "Forbidden" }, 403);
});

// POST: Status Updates & Messages
app.post(`${SERVER_BASE_PATH}/api/webhooks/whatsapp`, async (c) => {
  try {
    const signature = c.req.header("X-Hub-Signature-256");
    const rawBody = await c.req.text();

    // SECURITY: Verify HMAC signature from WhatsApp/Meta
    const isValid = await verifyWhatsAppSignature(rawBody, signature || null);
    if (!isValid) {
      console.error("[WhatsApp Webhook] HMAC verification failed");
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = JSON.parse(rawBody);

    // Check if it's a status update
    if (body.entry && body.entry[0]?.changes && body.entry[0]?.changes[0]?.value?.statuses) {
      const statuses = body.entry[0].changes[0].value.statuses;
      await processWhatsAppStatuses(statuses);
    }

    return c.json({ status: 'ok' });
  } catch (error) {
    // SECURITY: Use getErrorMessage to redact PII from the error before logging
    console.error("[WhatsApp Webhook] Error processing POST:", getErrorMessage(error));
    return c.json({ error: "Internal Error" }, 500);
  }
});

if (import.meta.main) {
  Deno.serve(app.fetch);
}

export default app;
