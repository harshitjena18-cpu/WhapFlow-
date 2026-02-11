import { Hono } from "npm:hono";
import { sendWhatsAppTemplate } from "./whatsapp.ts";

const whatsappApp = new Hono();

/**
 * WhatsApp Sender (Simulation)
 * Path: /send (mounted at /api/whatsapp)
 */
whatsappApp.post("/send", async (c) => {
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

export default whatsappApp;
