/**
 * WhatsApp Cloud API Integration Helper
 * 
 * Future purpose:
 * - Handle authentication with Meta Graph API
 * - Send template messages
 * - Process delivery receipts (webhooks)
 */

import { WhatsAppMessageRequest } from "../types";

export const sendWhatsAppMessage = async (request: WhatsAppMessageRequest): Promise<boolean> => {
  // TODO: Call Meta Graph API
  // POST https://graph.facebook.com/v17.0/{PHONE_NUMBER_ID}/messages
  console.log('[WhatsApp] Sending message to', request.phoneNumber);
  return true;
};

export const getTemplateStatus = async (templateId: string): Promise<string> => {
  const accessToken = import.meta.env?.VITE_WHATSAPP_ACCESS_TOKEN;

  if (!accessToken) {
    console.warn('VITE_WHATSAPP_ACCESS_TOKEN is not set');
    return 'APPROVED';
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${templateId}?fields=status`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error fetching template status:', errorData);
      return 'UNKNOWN';
    }

    const data = await response.json();
    return data.status;
  } catch (error) {
    console.error('Failed to get template status', error);
    return 'UNKNOWN';
  }
};
