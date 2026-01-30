/**
 * WhatsApp Cloud API Service
 * Handles interaction with Meta's Graph API for sending messages.
 */
import * as kv from "./kv_store.tsx";

interface SendMessageParams {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
}

export const sendWhatsAppTemplate = async ({
  to,
  templateName = "abandoned_cart_test",
  languageCode = "en_US",
  components = []
}: SendMessageParams) => {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  if (!token || !phoneId) {
    console.error("❌ Missing WhatsApp configuration (WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID)");
    return { success: false, error: "Configuration missing" };
  }

  const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;

  const body = {
    messaging_product: "whatsapp",
    to: to,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode
      },
      components: components
    }
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ WhatsApp API Error:", JSON.stringify(data, null, 2));
      return { success: false, error: data };
    }

    console.log("✅ WhatsApp Message Sent:", data);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Network/Server Error sending WhatsApp:", error);
    return { success: false, error };
  }
};

export const processWhatsAppStatus = async (payload: any, kvStore: any = kv) => {
  try {
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const statuses = value?.statuses;

    if (!statuses) return;

    for (const statusUpdate of statuses) {
      const wamid = statusUpdate.id;
      const status = statusUpdate.status; // sent, delivered, read
      const timestamp = statusUpdate.timestamp;

      // Look up cart ID
      const cartId = await kvStore.get(`msg_map:${wamid}`);

      if (cartId) {
        console.log(`[WhatsApp Status] Update for cart ${cartId}: ${status}`);

        // Update Cart
        const cartKey = `abandoned_cart:${cartId}`;
        const cart = await kvStore.get(cartKey);

        if (cart) {
          cart.delivery_status = status;
          // Dynamically set status time (sent_at, delivered_at, read_at)
          cart[`${status}_at`] = new Date(parseInt(timestamp) * 1000).toISOString();
          cart.updated_at = new Date().toISOString();

          await kvStore.set(cartKey, cart);
        } else {
             console.warn(`[WhatsApp Status] Cart ${cartId} not found for wamid ${wamid}`);
        }
      } else {
          // This is expected for messages sent before we started tracking wamids
          // or messages not related to abandoned carts (if shared number)
          console.log(`[WhatsApp Status] No cart found for message ${wamid}`);
      }
    }
  } catch (error) {
    console.error("Error processing WhatsApp status:", error);
  }
};
