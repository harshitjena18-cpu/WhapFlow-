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
  // Call the backend API proxy to handle the request securely
  // This avoids exposing secrets and handles CORS
  const url = '/make-server-c8eef56a/api/whatsapp/send';

  const components = [];

  if (request.parameters) {
    // Sort keys to ensure deterministic order.
    // We sort numerically if keys are numbers (e.g., "1", "2"), otherwise lexicographically.
    const sortedParams = Object.entries(request.parameters).sort(([keyA], [keyB]) => {
      const numA = parseInt(keyA);
      const numB = parseInt(keyB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return keyA.localeCompare(keyB);
    });

    const bodyParameters = sortedParams.map(([_, value]) => ({
      type: 'text',
      text: value
    }));

    if (bodyParameters.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyParameters
      });
    }
  }

  const payload = {
    phoneNumber: request.phoneNumber,
    templateId: request.templateId,
    components: components.length > 0 ? components : undefined
  };

  try {
    console.log('[WhatsApp] Sending message via backend to', request.phoneNumber);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp] Backend API Error:', data);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[WhatsApp] Network Error:', error);
    return false;
  }
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
