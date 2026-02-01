/**
 * WhatsApp Cloud API Integration Helper
 * 
 * Future purpose:
 * - Handle authentication with Meta Graph API
 * - Send template messages
 * - Process delivery receipts (webhooks)
 */

import { WhatsAppMessageRequest } from "../types";

const getEnv = (key: string): string | undefined => {
  // @ts-ignore: Deno is only available in Deno environment
  if (typeof Deno !== "undefined") return Deno.env.get(key);
  // @ts-ignore: process is only available in Node.js environment
  if (typeof globalThis.process !== "undefined") return globalThis.process.env[key];
  return undefined;
};

export const sendWhatsAppMessage = async (request: WhatsAppMessageRequest): Promise<boolean> => {
  const phoneNumberId = getEnv("WHATSAPP_PHONE_NUMBER_ID");
  const accessToken = getEnv("WHATSAPP_ACCESS_TOKEN");

  if (!phoneNumberId || !accessToken) {
    console.error("[WhatsApp] Missing configuration: WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN");
    return false;
  }

  const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;

  // Construct components from parameters
  const components = [];
  if (request.parameters && Object.keys(request.parameters).length > 0) {
    const sortedKeys = Object.keys(request.parameters).sort((a, b) => {
      // Try numeric sort first, fallback to string sort
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });

    const bodyParameters = sortedKeys.map(key => ({
      type: "text",
      text: request.parameters![key]
    }));

    components.push({
      type: "body",
      parameters: bodyParameters
    });
  }

  const body = {
    messaging_product: "whatsapp",
    to: request.phoneNumber,
    type: "template",
    template: {
      name: request.templateId,
      language: {
        code: "en_US" // Default language, could be parameterized if needed
      },
      components: components
    }
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[WhatsApp] API Error:", JSON.stringify(data, null, 2));
      return false;
    }

    console.log("[WhatsApp] Message sent successfully to", request.phoneNumber);
    return true;
  } catch (error) {
    console.error("[WhatsApp] Network error:", error);
    return false;
  }
};

export const getTemplateStatus = async (templateId: string, accessTokenOverride?: string): Promise<string | null> => {
  const accessToken = accessTokenOverride || getEnv("WHATSAPP_ACCESS_TOKEN");
  const businessAccountId = getEnv("WHATSAPP_BUSINESS_ACCOUNT_ID");

  if (!accessToken) {
    console.error("[WhatsApp] Missing access token");
    return null;
  }

  if (!businessAccountId) {
    console.error("[WhatsApp] Missing business account ID");
    return null;
  }

  const url = `https://graph.facebook.com/v17.0/${businessAccountId}/message_templates?name=${encodeURIComponent(templateId)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[WhatsApp] Failed to fetch template status:", JSON.stringify(errorData, null, 2));
      return null;
    }

    const data = await response.json();

    // Find the template with 'en_US' language, or fallback to the first one if only one exists
    // deno-lint-ignore no-explicit-any
    const template = data.data.find((t: any) => t.language === "en_US") || data.data[0];

    if (template) {
      return template.status;
    } else {
       console.warn(`[WhatsApp] Template '${templateId}' not found.`);
       return null;
    }

  } catch (error) {
    console.error("[WhatsApp] Network error checking template status:", error);
    return null;
  }
};
