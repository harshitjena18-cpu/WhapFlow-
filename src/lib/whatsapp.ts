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
  try {
    // Call the local backend proxy to avoid exposing credentials
    const response = await fetch(`/make-server-c8eef56a/api/whatsapp/templates/${templateId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[WhatsApp] Error fetching template status from backend:', errorData);
      return 'UNKNOWN';
    }

    const data = await response.json();
    return data.status || 'UNKNOWN';
  } catch (error) {
    console.error('[WhatsApp] Network error fetching template status:', error);
    return 'UNKNOWN';
  }
};
