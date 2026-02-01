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
    // Construct search query: created_at:>=... AND (email:... OR phone:...)
    // Include status:open OR status:closed OR status:cancelled to catch ALL orders
    const clauses = [
      `created_at:>=${cartCreatedAt}`,
      `(status:open OR status:closed OR status:cancelled)`
    ];

    const contactClauses = [];
    // Quote values to handle spaces/special chars safely
    if (email) contactClauses.push(`email:"${email}"`);
    if (phone) contactClauses.push(`phone:"${phone}"`);

    if (contactClauses.length > 0) {
        clauses.push(`(${contactClauses.join(' OR ')})`);
    } else {
        console.warn(`[ShopifyClient] No contact info to check order for ${shop}`);
        return true; // Fail safe: assume order exists/risk of spam
    }

    const searchQuery = clauses.join(' AND ');

    // Only request 'id' and 'first: 1' for maximum efficiency
    const query = `
      query checkOrders($query: String!) {
        orders(first: 1, query: $query) {
          nodes {
            id
          }
        }
      }
    `;

    // 2. Call Shopify GraphQL API
    const data = await shopifyGraphql(shop, accessToken, query, { query: searchQuery });
    const orders = data.orders.nodes || [];

    if (orders.length > 0) {
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
