
// scripts/verify_bolt_webhook_opt.ts

const mockKV = {
  data: new Map<string, any>(),
  async get(key: string) {
    console.log(`[MockKV] GET ${key}`);
    return this.data.get(key) ?? null;
  },
  async set(key: string, value: any) {
    console.log(`[MockKV] SET ${key}`);
    this.data.set(key, value);
  },
  async mget(keys: string[]) {
    console.log(`[MockKV] MGET ${keys.join(", ")}`);
    return keys.map(k => this.data.get(k) ?? null);
  },
  async mset(keys: string[], values: any[]) {
    console.log(`[MockKV] MSET ${keys.join(", ")}`);
    keys.forEach((k, i) => this.data.set(k, values[i]));
  },
  async getByPrefixAndValue(prefix: string, path: string, value: any, limit: number) {
    console.log(`[MockKV] GETBYPREFIXANDVALUE ${prefix} ${path}=${value}`);
    const results = Array.from(this.data.entries())
      .filter(([k, v]) => k.startsWith(prefix) && v.enabled === value)
      .map(([, v]) => v);
    return results.slice(0, limit);
  }
};

const mockEncrypt = async (val: string) => {
    return "enc:" + val;
};

// Simulation of createJob from queue.ts
function simulateCreateJob(payload: any, delay: number) {
    const id = "job_" + Math.random().toString(36).substr(2, 9);
    const scheduled_for = new Date(Date.now() + delay * 60 * 1000).toISOString();
    return {
        id,
        key: `queue:v1:${scheduled_for}:${id}`,
        payload,
        scheduled_for
    };
}

// Simulation of the NEW optimized Shopify webhook handler
async function simulatedBoltOptimizedWebhook(webhookId: string, shop: string, payload: any, templates: any[]) {
    console.log(`\n--- Starting Simulated Bolt Optimized Webhook (Shop: ${shop}) ---`);

    // Setup mock data
    templates.forEach(t => mockKV.data.set(`shop:${shop}:template:${t.id}`, t));
    mockKV.data.set(`merchant:${shop}`, { shop, shopify_connected: true });
    mockKV.data.set(`shop:${shop}:config:whatsapp`, { connection_status: 'connected' });
    mockKV.data.set(`billing:${shop}`, { plan: 'starter', automation_enabled: true });

    // Step 1: Parallelized Fetch (Optimized with getByPrefixAndValue)
    const [configsResult, encryptionResult] = await Promise.all([
      Promise.all([
        mockKV.mget([
          `merchant:${shop}`,
          `shop:${shop}:config:whatsapp`,
          `billing:${shop}`,
          webhookId ? `webhook_id:${webhookId}` : "null_key"
        ]),
        mockKV.getByPrefixAndValue(`shop:${shop}:template:`, "value->enabled", true, 1)
      ]),
      Promise.all([
        mockEncrypt(payload.customer.first_name),
        mockEncrypt(payload.customer.email),
        mockEncrypt(payload.customer.phone)
      ])
    ]);

    const [configs, enabledTemplates] = configsResult;
    const [merchantData, whatsappConfig, billingConfig, dedupCheck] = configs;

    if (webhookId && dedupCheck) {
        console.log("Duplicate detected!");
        return { status: 'success', duplicate: true };
    }
    const [encName, encEmail, encPhone] = encryptionResult;

    const cartKey = `abandoned_cart:${payload.id}`;
    const abandonedCartData = {
        id: payload.id,
        shop,
        customer_name: encName,
        customer_email: encEmail,
        phone: encPhone,
        status: "pending"
    };

    // Prepare Batch updates
    const updateKeys = [cartKey];
    const updateValues: any[] = [abandonedCartData];
    if (webhookId) {
        updateKeys.push(`webhook_id:${webhookId}`);
        updateValues.push({ processed_at: new Date().toISOString() });
    }

    // Checks
    const merchant = merchantData;
    const enabledTemplate = enabledTemplates[0];

    if (!merchant || !merchant.shopify_connected) {
        console.log("Merchant not connected.");
        await mockKV.mset(updateKeys, updateValues);
        return { status: 'success' };
    }

    if (!enabledTemplate) {
        console.log("No enabled template found.");
        await mockKV.mset(updateKeys, updateValues);
    } else {
        console.log(`Enabled template found: ${enabledTemplate.template_name}`);
        const job = simulateCreateJob({ cartId: payload.id, shop }, enabledTemplate.delay_minutes);
        updateKeys.push(job.key);
        updateValues.push(job);

        // SINGLE BATCH WRITE
        await mockKV.mset(updateKeys, updateValues);
        console.log("Bolt Optimized: All data persisted in ONE batch.");
    }

    return { status: 'success' };
}

(async () => {
    const shop = "bolt-store.myshopify.com";
    const payload = {
        id: "cart_999",
        customer: { first_name: "Bolt", email: "bolt@speed.com", phone: "+111" }
    };

    console.log("🧪 Test Case 1: Happy Path (Template enabled)");
    const templates = [{ id: "t1", template_name: "welcome", enabled: true, delay_minutes: 30 }];
    await simulatedBoltOptimizedWebhook("wh_001", shop, payload, templates);

    // Verify persistence
    const cart = await mockKV.get("abandoned_cart:cart_999");
    const dedupe = await mockKV.get("webhook_id:wh_001");
    const queue = Array.from(mockKV.data.keys()).find(k => k.startsWith("queue:v1:"));

    if (cart && dedupe && queue) {
        console.log("✅ Happy Path Verified: Cart, Dedupe, and Job all persisted.");
    } else {
        console.error("❌ Happy Path Failed", { cart: !!cart, dedupe: !!dedupe, queue: !!queue });
    }

    console.log("\n🧪 Test Case 2: No Enabled Template");
    mockKV.data.clear();
    await simulatedBoltOptimizedWebhook("wh_002", shop, payload, [{ id: "t2", template_name: "off", enabled: false }]);

    const cart2 = await mockKV.get("abandoned_cart:cart_999");
    const queue2 = Array.from(mockKV.data.keys()).find(k => k.startsWith("queue:v1:"));
    if (cart2 && !queue2) {
        console.log("✅ No Template Path Verified: Cart persisted, no job created.");
    } else {
        console.error("❌ No Template Path Failed");
    }

    console.log("\n🧪 Test Case 3: Duplicate Webhook");
    mockKV.data.clear();
    // Pre-populate with a processed webhook
    mockKV.data.set("webhook_id:wh_already_done", { processed_at: new Date().toISOString() });

    const res3 = await simulatedBoltOptimizedWebhook("wh_already_done", shop, payload, templates);
    if (res3.duplicate) {
        console.log("✅ Duplicate Detection Verified.");
    } else {
        console.error("❌ Duplicate Detection Failed.");
    }
})();
