import { Hono } from "npm:hono";
import { getEnv } from "../../../lib/env.ts";
import { getErrorMessage } from "../../../lib/error.ts";
import { secureCompare } from "./crypto.ts";
import { sendWhatsAppTemplate } from "./whatsapp.ts";

const app = new Hono();

/**
 * WhatsApp Sender
 * Path: /api/whatsapp/send
 */
app.post("/send", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    // SECURITY: Protect endpoint from unauthorized use
    // Verify against API key for internal/admin access or legacy service role key
    const whatsappApiKey = getEnv("WHATSAPP_API_KEY");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const isWhatsappAuth = whatsappApiKey && authHeader && secureCompare(authHeader, `Bearer ${whatsappApiKey}`);
    const isServiceAuth = serviceRoleKey && authHeader && secureCompare(authHeader, `Bearer ${serviceRoleKey}`);

    if (!isWhatsappAuth && !isServiceAuth) {
      return c.json({ error: "Unauthorized: Invalid or missing token" }, 401);
    }


    const { phoneNumber, templateId } = await c.req.json();

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

export default app;
