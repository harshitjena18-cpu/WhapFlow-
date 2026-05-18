/**
 * WhatsApp Cloud API Integration Helper
 * 
 * Future purpose:
 * - Handle authentication with Meta Graph API
 * - Send template messages
 * - Process delivery receipts (webhooks)
 */

import type { WhatsAppMessageRequest } from "../types/index.ts";
import { getEnv } from "./env.ts";
import { getErrorMessage } from "./error.ts";

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
        code: request.language || "en_US"
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
      // SECURITY: Avoid logging full 'data' as it contains customer PII (phone number)
      console.error(`[WhatsApp] API Error: Status ${response.status}`);
      return false;
    }

    // SECURITY: Redact phoneNumber in logs
    console.log("[WhatsApp] Message sent successfully to [REDACTED]");
    return true;
  } catch (error) {
    // SECURITY: Redact PII from error messages
    console.error("[WhatsApp] Network error:", getErrorMessage(error));
    return false;
  }
};

export const getTemplateStatus = async (templateId: string, accessTokenOverride?: string, language?: string): Promise<string | null> => {
  const accessToken = accessTokenOverride || getEnv("WHATSAPP_ACCESS_TOKEN");
  const businessAccountId = getEnv("WHATSAPP_BUSINESS_ACCOUNT_ID");
  const targetLanguage = language || "en_US";

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
      // SECURITY: Redact error response to avoid leaking sensitive template metadata or account info
      console.error(`[WhatsApp] Failed to fetch template status: Status ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Find the template with the target language, or fallback to the first one if only one exists
    const template = data.data?.find((t: any) => t.language === targetLanguage) || data.data?.[0];

    if (template) {
      return template.status;
    } else {
       console.warn(`[WhatsApp] Template '${templateId}' not found for language '${targetLanguage}'.`);
       return null;
    }

  } catch (error) {
    // SECURITY: Redact PII from error messages
    console.error("[WhatsApp] Network error checking template status:", getErrorMessage(error));
    return null;
  }
};
