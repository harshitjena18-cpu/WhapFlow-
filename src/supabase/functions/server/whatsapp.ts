/**
 * WhatsApp Cloud API Service
 * Handles interaction with Meta's Graph API for sending messages.
 */

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

    // SECURITY: Log only wamid to avoid leaking PII in response data
    const wamid = data.messages?.[0]?.id;
    console.log("✅ WhatsApp Message Sent. ID:", wamid);
    return { success: true, data, wamid };
  } catch (error) {
    console.error("❌ Network/Server Error sending WhatsApp:", error);
    return { success: false, error };
  }
};
