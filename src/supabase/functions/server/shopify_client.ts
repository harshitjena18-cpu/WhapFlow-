import * as kv from "./kv_store.tsx";

/**
 * Retrieve merchant credentials from KV
 */
export async function getMerchantCredentials(shop: string) {
  return await kv.get(`merchant:${shop}`);
}

/**
 * Check if an abandoned cart has been converted to an order.
 * This is a mandatory safety check to prevent spam.
 */
export async function checkOrderExists(
  shop: string,
  accessToken: string,
  cartCreatedAt: string,
  email?: string,
  phone?: string
): Promise<boolean> {
  try {
    // 1. Build Query
    // We filter by created_at_min to only look for orders created AFTER the cart was created.
    // We fetch status=any to include open, closed, archived orders.
    const params = new URLSearchParams({
      status: "any",
      created_at_min: cartCreatedAt,
      fields: "id,email,phone,customer,created_at" // Optimize payload
    });

    const url = `https://${shop}/admin/api/2024-01/orders.json?${params.toString()}`;

    // 2. Call Shopify API
    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      console.error(`[ShopifyClient] Failed to fetch orders for ${shop}: ${response.statusText}`);
      // FAIL SAFE: If we can't check, assume it might exist (or just log error).
      // The requirement says "Always fail-safe (no message) on uncertainty".
      // So if this fails, we should probably treat it as "risk of spam" -> return true (stop message)?
      // Or return a specific error. 
      // For now, let's throw, and the caller handles the fail-safe.
      throw new Error(`Shopify API error: ${response.status}`);
    }

    const data = await response.json();
    const orders = data.orders || [];

    if (orders.length === 0) {
      return false; 
    }

    // 3. Match Order
    // Shopify's "search" param is fuzzy, so we iterate manually for exact match.
    // We check if any order belongs to the customer email or phone.
    const hasMatchingOrder = orders.some((order: any) => {
      const emailMatch = email && order.email && order.email.toLowerCase() === email.toLowerCase();
      const phoneMatch = phone && order.phone && formatPhone(order.phone) === formatPhone(phone);
      
      // Also check customer object if available
      const customerEmailMatch = email && order.customer?.email && order.customer.email.toLowerCase() === email.toLowerCase();
      const customerPhoneMatch = phone && order.customer?.phone && formatPhone(order.customer.phone) === formatPhone(phone);

      return emailMatch || phoneMatch || customerEmailMatch || customerPhoneMatch;
    });

    if (hasMatchingOrder) {
      console.log(`[ShopifyClient] MATCH FOUND: Order exists for ${email || phone} in ${shop}`);
      return true;
    }

    return false;

  } catch (error) {
    console.error(`[ShopifyClient] Error checking orders for ${shop}:`, error);
    // FAIL SAFE: If error, assume order exists to block message
    return true; 
  }
}

/**
 * Verify HMAC for Webhooks (Body-based)
 */
export async function verifyWebhookHmac(rawBody: string, hmacHeader: string, secret: string): Promise<boolean> {
  if (!rawBody || !hmacHeader || !secret) return false;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(rawBody);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));

  return hashBase64 === hmacHeader;
}

// Helper to normalize phone numbers for comparison
function formatPhone(phone: string): string {
  if (!phone) return "";
  return phone.replace(/\D/g, ""); // Remove non-digits
}

/**
 * Execute a GraphQL query/mutation against the Shopify Admin API
 */
export async function shopifyGraphql(
  shop: string,
  accessToken: string,
  query: string,
  variables: Record<string, any> = {}
) {
  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`[ShopifyGraphQL] HTTP Error: ${response.status}`, result);
      throw new Error(`Shopify GraphQL HTTP Error: ${response.status}`);
    }
    
    // Check for userErrors (common in mutations) but don't throw, let caller handle
    // However, if there are top-level "errors", we should probably throw or return them.
    if (result.errors) {
       console.error(`[ShopifyGraphQL] GraphQL Errors:`, result.errors);
       // We'll throw the first error message to simplify handling
       throw new Error(result.errors[0]?.message || "GraphQL Error");
    }

    return result.data;
  } catch (error) {
    console.error(`[ShopifyGraphQL] Network/System Error for ${shop}:`, error);
    throw error;
  }
}
