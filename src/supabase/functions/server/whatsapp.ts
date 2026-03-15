/**
 * WhatsApp Cloud API Service
 * Handles interaction with Meta's Graph API for sending messages.
 */

import { getEnv } from "../../../lib/env.ts";
import { Buffer } from "node:buffer";

interface SendMessageParams {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
}

// PERFORMANCE: Hoist TextEncoder to module level
const encoder = new TextEncoder();

// Module-level cache for HMAC CryptoKeys
let _cachedHmacKey: CryptoKey | null = null;
let _cachedHmacSecret: string | null = null;
let _hmacKeyPromise: Promise<CryptoKey> | null = null;

export const sendWhatsAppTemplate = async ({
  to,
  templateName = "abandoned_cart_test",
  languageCode = "en_US",
  components = []
}: SendMessageParams) => {
  const token = getEnv("WHATSAPP_ACCESS_TOKEN");
  const phoneId = getEnv("WHATSAPP_PHONE_NUMBER_ID");

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
      // SECURITY: Redact full response 'data' as it contains customer PII (phone number)
      console.error(`❌ WhatsApp API Error: Status ${response.status}`);
      // Return only the error message or a sanitized version
      const errorMessage = data.error?.message || "Unknown WhatsApp API Error";
      return { success: false, error: errorMessage };
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

/**
 * Verify WhatsApp Webhook Signature
 * Validates the X-Hub-Signature-256 header using HMAC-SHA256
 */
export async function verifyWhatsAppSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  const secret = getEnv("WHATSAPP_APP_SECRET");
  if (!secret) {
      console.error("[WhatsApp Webhook] Critical Error: WHATSAPP_APP_SECRET not configured");
      return false;
  }

  if (!signatureHeader || !rawBody) {
      return false;
  }

  // Header format: sha256=<signature_hex>
  const equalIndex = signatureHeader.indexOf("=");
  if (equalIndex === -1) {
    return false;
  }

  const method = signatureHeader.substring(0, equalIndex);
  const signature = signatureHeader.substring(equalIndex + 1);

  if (method !== "sha256" || !signature) {
      return false;
  }

  try {
    const msgData = encoder.encode(rawBody);

    // PERFORMANCE: Cache the imported CryptoKey
    // Uses promise-based caching to prevent thundering herd on concurrent webhooks.
    if (_cachedHmacSecret !== secret) {
      _cachedHmacKey = null;
      _hmacKeyPromise = null;
      _cachedHmacSecret = secret;
    }

    if (!_cachedHmacKey && !_hmacKeyPromise) {
      _hmacKeyPromise = (async () => {
        try {
          const keyData = encoder.encode(secret);
          _cachedHmacKey = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
          );
          return _cachedHmacKey;
        } catch (e) {
          _hmacKeyPromise = null;
          throw e;
        }
      })();
    }

    const key = _cachedHmacKey || (await _hmacKeyPromise!);

    const signatureBytes = Buffer.from(signature, "hex");

    return await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      msgData
    );
  } catch (error) {
    console.error("[WhatsApp Webhook] HMAC verification error:", error);
    return false;
  }
}
