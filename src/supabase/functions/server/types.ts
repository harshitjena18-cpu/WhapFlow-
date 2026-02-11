/**
 * Shared Types and Constants
 */

export interface WhatsAppStatus {
  id: string;
  status: string;
  timestamp?: string;
  recipient_id?: string;
  conversation?: {
    id: string;
    origin: {
      type: string;
    }
  };
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
  errors?: unknown[];
}

export interface AutomationTemplate {
  id: string;
  template_name: string;
  display_name: string;
  delay_minutes: number;
  content: string;
  generated_by_ai: boolean;
  ai_tone?: string | null;
  enabled: boolean;
  created_at: string;
}

export interface IntegrationConfig {
  connected_at: string | null;
  last_error: string | null;
  connection_status: 'connected' | 'disconnected' | 'error' | 'pending';
  metadata: Record<string, unknown>;
}

export interface AutomationPayload {
  cartId: string;
  cartKey: string;
  templateName: string;
  shop: string;
}

export const DEFAULT_CONFIG: IntegrationConfig = {
  connected_at: null,
  last_error: null,
  connection_status: 'disconnected',
  metadata: {}
};
