import { Hono } from "npm:hono";
import { getEnv } from "../../../lib/env.ts";
import { getErrorMessage } from "../../../lib/error.ts";
import { processWhatsAppStatuses } from "./automation.ts";
import { sendWhatsAppTemplate, verifyWhatsAppSignature } from "./whatsapp.ts";
import { SHOPIFY_DOMAIN_REGEX } from "./constants.ts";

const app = new Hono();

/**
 * WhatsApp Sender
 * Path: /api/whatsapp/send
 */
app.post("/whatsapp/send", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const shop = c.req.query("shop") || "global";

    // SECURITY: Use a dedicated API key instead of the service role key
    const whatsappApiKey = getEnv("WHATSAPP_API_KEY");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const isWhatsappAuth = !!whatsappApiKey && authHeader === `Bearer ${whatsappApiKey}`;
    const isServiceAuth = !!serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`;

    // SECURITY: Protect endpoint from unauthorized use
    if (!isWhatsappAuth && !isServiceAuth) {
      return c.json({ error: "Unauthorized: Invalid or missing token" }, 401);
    }

    if (isServiceAuth && !isWhatsappAuth) {
      console.warn(`[Security] Endpoint called with deprecated Service Role Key. Please migrate to WHATSAPP_API_KEY.`);
    }

    // SECURITY: Validate shop domain to prevent multi-tenancy leaks or unauthorized use
    if (shop !== "global" && !SHOPIFY_DOMAIN_REGEX.test(shop)) {
      return c.json({ error: "Invalid shop domain" }, 400);
    }

    const { phoneNumber, templateId } = await c.req.json();

    // SECURITY: Redact phoneNumber from logs
    console.log(`[WhatsApp] Intent to send template "${templateId}" to [REDACTED] (Shop: ${shop})`);

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
 * Path: /api/webhooks/whatsapp
 */
// GET: Verification Challenge
app.get("/webhooks/whatsapp", (c) => {
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");

  const verifyToken = getEnv("WHATSAPP_VERIFY_TOKEN");

  // SECURITY: Ensure verifyToken is configured and matches the request token
  if (mode === "subscribe" && verifyToken && token === verifyToken) {
    console.log("[WhatsApp Webhook] Webhook verified.");
    return c.text(challenge || "");
  }

  console.error("[WhatsApp Webhook] Verification failed.");
  return c.json({ error: "Forbidden" }, 403);
});

// POST: Status Updates & Messages
app.post("/webhooks/whatsapp", async (c) => {
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
      // PERFORMANCE: Process all status updates in a single optimized batch
      await processWhatsAppStatuses(statuses);
    }

    return c.json({ status: 'ok' });
  } catch (error) {
    // SECURITY: Redact PII from the error message before logging
    console.error("[WhatsApp Webhook] Error processing POST:", getErrorMessage(error));
    return c.json({ error: "Internal Error" }, 500);
  }
});

export default app;
