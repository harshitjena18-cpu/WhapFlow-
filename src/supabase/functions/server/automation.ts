import * as kv from "./kv_store.tsx";
import * as billing from "./billing.ts";
import { BILLING_KEY_PREFIX } from "./billing.ts";
import { decrypt } from "./crypto.ts";
import { checkOrderExists, getMerchantCredentials } from "./shopify_client.ts";
import { sendWhatsAppTemplate } from "./whatsapp.ts";
import { enqueueJob } from "./queue.ts";
import {
  AutomationPayload,
  AutomationTemplate,
  WhatsAppStatus
} from "./types.ts";

// Helper: Ensure only one template is enabled for a specific shop
export async function disableOtherTemplates(exceptId: string, shop: string = "global") {
  // SECURITY: Scoping by shop prevents cross-merchant template disabling
  const prefix = `shop:${shop}:template:`;

  // PERFORMANCE: Fetch only enabled templates using DB-side filtering to avoid full table scan
  // This reduces memory usage and network transfer compared to fetching all templates
  const templates = await kv.getByPrefixAndValue<AutomationTemplate>(prefix, "value->enabled", true);

  const updateKeys: string[] = [];
  const updateValues: AutomationTemplate[] = [];

  for (const t of templates) {
    if (t.id !== exceptId) {
      t.enabled = false;
      updateKeys.push(`${prefix}${t.id}`);
      updateValues.push(t);
    }
  }

  if (updateKeys.length > 0) {
    await kv.mset(updateKeys, updateValues);
    console.log(`[Templates] Disabled ${updateKeys.length} other templates for shop ${shop}`);
  }
}

export function validateTemplateContent(content: string): string | null {
  if (!content || !content.trim()) return "Content cannot be empty";
  if (content.length > 1024) return "Content exceeds 1024 characters";
  if (!content.includes("{{checkout_link}}")) return "Content must include {{checkout_link}}";
  return null;
}

export async function scheduleAutomation(payload: AutomationPayload, delayMinutes: number) {
  console.log(`[Automation] Scheduling job for cart ${payload.cartId} in ${delayMinutes} minutes...`);
  await enqueueJob(payload, delayMinutes);
}

export async function executeAutomation(payload: AutomationPayload) {
  const { cartId, cartKey, templateName, shop } = payload;

  try {
    console.log(`🚀 EXECUTE AUTOMATION for cart ${cartId} (Shop: ${shop})`);

    // 1. PERFORMANCE: Fetch all required data in parallel. Use targeted DB query for templates.
    // This reduces the number of concurrent database requests from 3 to 2.
    const [configs, rawTemplates] = await Promise.all([
      kv.mget([
        `merchant:${shop}`,
        `${billing.BILLING_KEY_PREFIX}${shop}`,
        cartKey
      ]),
      kv.getByPrefixAndValue<AutomationTemplate>(`shop:${shop}:template:`, "value->enabled", true, 1)
    ]);

    const [merchantData, preFetchedBilling, currentCart] = configs;

    // 2. EARLY RETURNS: Skip processing as soon as possible if conditions aren't met
    if (!currentCart) {
      console.log(`❌ AUTOMATION SKIPPED: Cart [${cartId}] no longer exists.`);
      return;
    }

    if (currentCart.status !== 'pending') {
      console.log(`⏹️ AUTOMATION SKIPPED: Cart [${cartId}] status is ${currentCart.status}`);
      return;
    }

    const templates = rawTemplates || [];
    if (!templates.some(t => t.enabled)) {
      console.log('⏹️ AUTOMATION SKIPPED: No enabled templates found.');
      return;
    }

    // 3. PERFORMANCE: Parallelize Merchant/Billing derivations and PII Decryption
    const [merchant, billingConfig, decName, decEmail, decPhone] = await Promise.all([
      getMerchantCredentials(shop, merchantData),
      billing.getBillingConfig(shop, preFetchedBilling),
      decrypt(currentCart.customer_name),
      decrypt(currentCart.customer_email),
      decrypt(currentCart.phone)
    ]);

    if (!merchant || !merchant.access_token) {
      console.error(`❌ AUTOMATION FAILED: No credentials found for ${shop}`);
      return;
    }

    // 1. Pre-checks (Status & Plan)
    const isPending = currentCart.status === 'pending';
    const hasEnabledTemplate = (templates as AutomationTemplate[]).some(t => t.enabled);
    const automationCheck = billing.checkLimitWithConfig('automation', billingConfig);
    const whatsappCheck = billing.checkLimitWithConfig('whatsapp', billingConfig);

    if (!automationCheck.allowed || !whatsappCheck.allowed) {
      console.log('⏹️ AUTOMATION SKIPPED: Plan limits reached.');
      return;
    }

    // 5. SAFETY CHECK: Verify if order exists to prevent spam
    console.log(`   - API CHECK: Checking if order exists for ${shop}...`);
    const orderExists = await checkOrderExists(
        shop,
        merchant.access_token,
        currentCart.created_at,
        decEmail,
        decPhone
    );

    if (orderExists) {
      console.log(`⏹️ AUTOMATION SKIPPED: Order found for cart ${cartId}.`);
      currentCart.status = 'converted';
      currentCart.converted_at = new Date().toISOString();
      await kv.set(cartKey, currentCart);
      return;
    }

    // 3. Final Execution
    // SECURITY/RELIABILITY: Fix potential ReferenceError and logic duplication.
    // Pre-execution conditions (isPending, hasEnabledTemplate, limits) are already checked via early returns above.
    console.log(`✅ CONDITIONS MET: Ready to send WhatsApp message.`);
    console.log(`   - Automation ready using template: ${templateName}`);

    const result = await sendWhatsAppTemplate({
      to: decPhone,
      templateName: templateName,
      languageCode: "en_US"
    });

    const updateKeys = [];
    const updateValues = [];

    if (result.success) {
      // PERFORMANCE: Batch all updates (Billing, Message Map, Cart) in a single request

      // 1. Increment Usage (manually since we already have the config)
      billingConfig.whatsapp_conversations_used += 1;
      updateKeys.push(`${BILLING_KEY_PREFIX}${shop}`);
      updateValues.push(billingConfig);

      // 2. Update Cart Status
      currentCart.status = 'messaged';
      currentCart.messaged_at = new Date().toISOString();

      if (result.wamid) {
           currentCart.wamid = result.wamid;
           // 3. Map message ID to cart for status tracking
           updateKeys.push(`msg_map:${result.wamid}`);
           updateValues.push(cartId);
           console.log(`🔗 Mapped message ${result.wamid} to cart ${cartId}`);
      }

      updateKeys.push(cartKey);
      updateValues.push(currentCart);
    } else {
      // SECURITY: result.error is already sanitized/redacted in whatsapp.ts
      console.error(`❌ AUTOMATION FAILED: WhatsApp API Error for cart ${cartId}: ${result.error}`);
      currentCart.status = 'failed';
      currentCart.last_error = result.error;
      updateKeys.push(cartKey);
      updateValues.push(currentCart);
    }

    if (updateKeys.length > 0) {
      // Atomic batch update to ensure data consistency
      await kv.mset(updateKeys, updateValues);
      console.log(`⚡ [Automation] Optimized: Persisted ${updateKeys.length} updates in a single batch.`);
    }

  } catch (err) {
    console.error(`❌ CRITICAL AUTOMATION ERROR for cart ${cartId}:`, err);
    try {
      // Attempt to record failure state so the job isn't silently lost
      const cart = await kv.get(cartKey);
      if (cart) {
        cart.status = 'failed';
        cart.last_error = String(err);
        await kv.set(cartKey, cart);
      }
    } catch (_e) { /* Ignore secondary storage error */ }
  }
}

// Helper: Process WhatsApp Status Updates in Batch
export async function processWhatsAppStatuses(statuses: WhatsAppStatus[]) {
  if (statuses.length === 0) return;

  // PERFORMANCE: Batch fetch all cart ID mappings in a single request (Single pass map)
  const msgMapKeys = statuses.map(s => `msg_map:${s.id}`);
  const cartIds = await kv.mget(msgMapKeys);

  // Map cartId -> newStatus. Last update wins if duplicates exist.
  const updatesByCartId = new Map<string, string>();

  for (let i = 0; i < statuses.length; i++) {
    const cartId = cartIds[i];
    const wamid = statuses[i].id;
    const newStatus = statuses[i].status;

    if (cartId) {
      updatesByCartId.set(cartId, newStatus);
      console.log(`[WhatsApp Status] Message ${wamid} (${newStatus}) linked to cart ${cartId}`);
    } else {
      console.log(`[WhatsApp Status] No cart found for message ${wamid}`);
    }
  }

  if (updatesByCartId.size === 0) return;

  // PERFORMANCE: Batch fetch only unique associated carts
  const uniqueCartIds = Array.from(updatesByCartId.keys());
  const uniqueCartKeys = uniqueCartIds.map(id => `abandoned_cart:${id}`);

  const carts = await kv.mget(uniqueCartKeys);

  const updateKeys: string[] = [];
  const updateValues: any[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < uniqueCartIds.length; i++) {
    const cart = carts[i];
    const cartId = uniqueCartIds[i];

    if (cart) {
      const newStatus = updatesByCartId.get(cartId);
      if (newStatus) {
        cart.delivery_status = newStatus;
        cart.updated_at = now;
        updateKeys.push(uniqueCartKeys[i]);
        updateValues.push(cart);
        console.log(`[WhatsApp Status] Prepared update for cart ${cartId} status: ${newStatus}`);
      }
    }
  }

  // PERFORMANCE: Batch persist only unique updated carts
  if (updateKeys.length > 0) {
    await kv.mset(updateKeys, updateValues);
    console.log(`[WhatsApp Status] Successfully persisted ${updateKeys.length} cart updates.`);
  }
}
