import { Hono } from "npm:hono";
import { getEnv } from "../../../lib/env.ts";
import { processWhatsAppStatuses } from "./automation.ts";
import { sendWhatsAppTemplate } from "./whatsapp.ts";

const app = new Hono();

/**
 * WhatsApp Sender
 * Path: /api/whatsapp/send
 */
app.post("/whatsapp/send", async (c) => {
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
    const body = await c.req.json();

    // Check if it's a status update
    if (body.entry && body.entry[0]?.changes && body.entry[0]?.changes[0]?.value?.statuses) {
      const statuses = body.entry[0].changes[0].value.statuses;
      // PERFORMANCE: Process all status updates in a single optimized batch
      await processWhatsAppStatuses(statuses);
    }

    return c.json({ status: 'ok' });
  } catch (error) {
    console.error("[WhatsApp Webhook] Error processing POST:", error);
    return c.json({ error: "Internal Error" }, 500);
  }
});

export default app;
