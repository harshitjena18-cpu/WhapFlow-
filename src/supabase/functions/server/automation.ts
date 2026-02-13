import * as kv from "./kv_store.tsx";
import * as billing from "./billing.ts";
import { BILLING_KEY_PREFIX } from "./billing.ts";
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
  // deno-lint-ignore no-explicit-any
  const templates = (await kv.getByPrefixAndValue(prefix, "value->enabled", true)) as AutomationTemplate[];

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
    console.log(`   Checking logic...`);

    // Fetch all required data in parallel to minimize latency and fix variable access order
    // PERFORMANCE: Batch simple KV lookups to reduce database round-trips
    const [kvData, rawTemplates] = await Promise.all([
      kv.mget([
        cartKey,
        `merchant:${shop}`,
        `${billing.BILLING_KEY_PREFIX}${shop}`
      ]),
      kv.getByPrefix(`shop:${shop}:template:`)
    ]);

    const [currentCart, rawMerchant, rawBillingConfig] = kvData;

    // Use pre-fetched data to elide internal database calls
    const [merchant, billingConfig] = await Promise.all([
      getMerchantCredentials(shop, rawMerchant),
      billing.getBillingConfig(shop, rawBillingConfig)
    ]);
    const templates = (rawTemplates || []) as AutomationTemplate[];

    if (!currentCart) {
      console.log(`❌ AUTOMATION SKIPPED: Cart [${cartId}] no longer exists.`);
      return;
    }

    if (!merchant || !merchant.access_token) {
      console.error(`❌ AUTOMATION FAILED: No credentials found for ${shop}`);
      return;
    }

    // 1. Pre-checks (Status & Plan)
    const isPending = currentCart.status === 'pending';
    const hasEnabledTemplate = (templates as AutomationTemplate[]).some(t => t.enabled);
    const automationCheck = billing.checkLimitWithConfig('automation', billingConfig);
    const whatsappCheck = billing.checkLimitWithConfig('whatsapp', billingConfig);

    if (!isPending || !hasEnabledTemplate || !automationCheck.allowed || !whatsappCheck.allowed) {
      console.log('⏹️ AUTOMATION SKIPPED: Pre-conditions not met (e.g. cart already messaged, automation off, or limit reached).');
      return;
    }

    // 2. Orders API Safety Check (Preventing spam if already converted)
    console.log(`   - API CHECK: Checking if order exists for ${shop}...`);
    const orderExists = await checkOrderExists(
        shop,
        merchant.access_token,
        currentCart.created_at,
        currentCart.customer_email,
        currentCart.phone
    );

    if (orderExists) {
      console.log(`⏹️ AUTOMATION SKIPPED: Order found for cart ${cartId}.`);
      currentCart.status = 'converted';
      currentCart.converted_at = new Date().toISOString();
      await kv.set(cartKey, currentCart);
      return;
    }

    // 3. Final Execution
    if (isPending && hasEnabledTemplate && automationCheck.allowed && whatsappCheck.allowed) {
      console.log(`✅ CONDITIONS MET: Ready to send WhatsApp message.`);
      console.log(`   - Automation ready using template: ${templateName}`);

      const result = await sendWhatsAppTemplate({
        to: currentCart.phone,
        templateName: templateName,
        languageCode: "en_US"
      });

      if (result.success) {
        // PERFORMANCE: Batch all updates (Billing, Message Map, Cart) in a single request
        const updateKeys = [];
        const updateValues = [];

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

        // Atomic batch update
        await kv.mset(updateKeys, updateValues);
        console.log(`⚡ [Automation] Optimized: Persisted ${updateKeys.length} updates in a single batch.`);

      } else {
        console.error(`❌ AUTOMATION FAILED: WhatsApp API Error for cart ${cartId}`, result.error);
        currentCart.status = 'failed';
        currentCart.last_error = result.error;
        await kv.set(cartKey, currentCart);
      }
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

  const wamids = statuses.map(s => s.id);
  const msgMapKeys = wamids.map(id => `msg_map:${id}`);

  // PERFORMANCE: Batch fetch all cart ID mappings in a single request
  const cartIds = await kv.mget(msgMapKeys);

  const validUpdates: { cartId: string, newStatus: string }[] = [];
  const cartKeys: string[] = [];

  for (let i = 0; i < statuses.length; i++) {
    const cartId = cartIds[i];
    const wamid = statuses[i].id;
    const newStatus = statuses[i].status;

    if (cartId) {
      validUpdates.push({ cartId, newStatus });
      cartKeys.push(`abandoned_cart:${cartId}`);
      console.log(`[WhatsApp Status] Message ${wamid} (${newStatus}) linked to cart ${cartId}`);
    } else {
      console.log(`[WhatsApp Status] No cart found for message ${wamid}`);
    }
  }

  if (cartKeys.length === 0) return;

  // PERFORMANCE: Batch fetch all associated carts in a single request
  const carts = await kv.mget(cartKeys);

  const updateKeys: string[] = [];
  const updateValues: any[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < validUpdates.length; i++) {
    const cart = carts[i];
    if (cart) {
      cart.delivery_status = validUpdates[i].newStatus;
      cart.updated_at = now;
      updateKeys.push(`abandoned_cart:${validUpdates[i].cartId}`);
      updateValues.push(cart);
      console.log(`[WhatsApp Status] Prepared update for cart ${validUpdates[i].cartId} status: ${validUpdates[i].newStatus}`);
    }
  }

  // PERFORMANCE: Batch persist all updated carts in a single request
  if (updateKeys.length > 0) {
    await kv.mset(updateKeys, updateValues);
    console.log(`[WhatsApp Status] Successfully persisted ${updateKeys.length} cart updates.`);
  }
}
