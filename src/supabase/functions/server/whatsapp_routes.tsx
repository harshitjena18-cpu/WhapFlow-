import { Hono } from "npm:hono";
import { getEnv } from "../../../lib/env.ts";
import { getErrorMessage } from "../../../lib/error.ts";
import { sendWhatsAppTemplate } from "./whatsapp.ts";
import { SHOPIFY_DOMAIN_REGEX, E164_REGEX } from "./constants.ts";

const app = new Hono();

/**
 * WhatsApp Sender
 * Path: /api/whatsapp/send (Mounted at /api/whatsapp)
 */
app.post("/send", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const shop = c.req.query("shop") || "global";

    // SECURITY: Protect endpoint from unauthorized use
    // Verify against API key for internal/admin access or legacy service role key
    const whatsappApiKey = getEnv("WHATSAPP_API_KEY");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const isWhatsappAuth = whatsappApiKey && authHeader === `Bearer ${whatsappApiKey}`;
    const isServiceAuth = serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`;

    if (!isWhatsappAuth && !isServiceAuth) {
      return c.json({ error: "Unauthorized: Invalid or missing token" }, 401);
    }

    // SECURITY: Validate shop domain
    if (shop !== "global" && !SHOPIFY_DOMAIN_REGEX.test(shop)) {
      return c.json({ error: "Invalid shop domain" }, 400);
    }

    const { phoneNumber, templateId } = await c.req.json();

    // SECURITY: Validate phone number format (E.164)
    if (!phoneNumber || !E164_REGEX.test(phoneNumber)) {
      return c.json({ error: "Invalid phone number format. Expected E.164 (e.g. +1234567890)" }, 400);
    }

    // Call the shared helper
    const result = await sendWhatsAppTemplate({
      to: phoneNumber,
      templateName: templateId || "abandoned_cart_test",
      languageCode: "en_US"
    });

    if (result.success) {
      // SECURITY: Sanitize response to return only necessary metadata (wamid)
      // instead of the full Meta API response which contains the recipient phone number.
      return c.json({
        success: true,
        message: 'Message sent',
        wamid: result.wamid
      }, 200);
    } else {
      return c.json({ error: 'WhatsApp API Error', details: result.error }, 500);
    }

  } catch (_error) {
    return c.json({ error: 'Invalid request' }, 400);
  }
});


export default app;
