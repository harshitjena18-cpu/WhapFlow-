
// scripts/verify_optimized_webhooks.ts

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
  async getByPrefix(prefix: string) {
    console.log(`[MockKV] GETBYPREFIX ${prefix}`);
    return Array.from(this.data.entries())
      .filter(([k]) => k.startsWith(prefix))
      .map(([, v]) => v);
  }
};

const mockEncrypt = async (val: string) => {
    console.log(`[MockCrypto] ENCRYPT ${val}`);
    return "enc:" + val;
};

// Simulation of the optimized Shopify webhook handler
async function simulatedShopifyWebhook(webhookId: string, shop: string, payload: any) {
    console.log("--- Starting Simulated Optimized Webhook ---");

    // Step 1: HMAC check (assumed passed)

    // Step 2: Parallelized Fetch
    const [dedupCheck, configsResult, encryptionResult] = await Promise.all([
      webhookId ? mockKV.get(`webhook_id:${webhookId}`) : Promise.resolve(null),
      Promise.all([
        mockKV.mget([
          `merchant:${shop}`,
          `shop:${shop}:config:whatsapp`,
          `billing:${shop}`
        ]),
        mockKV.getByPrefix(`shop:${shop}:template:`)
      ]),
      Promise.all([
        mockEncrypt(payload.customer.first_name),
        mockEncrypt(payload.customer.email),
        mockEncrypt(payload.customer.phone)
      ])
    ]);

    if (dedupCheck) {
        console.log("Duplicate detected!");
        return { status: 'success', duplicate: true };
    }

    const [configs, rawTemplates] = configsResult;
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

    // Step 3: Batch writes
    const updateKeys = [cartKey];
    const updateValues = [abandonedCartData];
    if (webhookId) {
        updateKeys.push(`webhook_id:${webhookId}`);
        updateValues.push({ processed_at: new Date().toISOString() });
    }
    await mockKV.mset(updateKeys, updateValues);

    console.log("Webhook processed successfully.");
    return { status: 'success' };
}

(async () => {
    const shop = "test-store.myshopify.com";
    const webhookId = "wh_123";
    const payload = {
        id: "cart_456",
        customer: {
            first_name: "John",
            email: "john@example.com",
            phone: "+123456789"
        }
    };

    console.log("\n🧪 Running Test 1: First Attempt...");
    const res1 = await simulatedShopifyWebhook(webhookId, shop, payload);

    if (res1.status === 'success' && !res1.duplicate) {
        console.log("✅ Test 1 Passed");
    } else {
        console.error("❌ Test 1 Failed", res1);
    }

    console.log("\n🧪 Running Test 2: Duplicate Attempt...");
    const res2 = await simulatedShopifyWebhook(webhookId, shop, payload);

    if (res2.status === 'success' && res2.duplicate) {
        console.log("✅ Test 2 Passed");
    } else {
        console.error("❌ Test 2 Failed", res2);
    }

    const savedCart = await mockKV.get("abandoned_cart:cart_456");
    if (savedCart && savedCart.customer_name === "enc:John") {
        console.log("✅ Data Persistence Verified");
    } else {
        console.error("❌ Data Persistence Verification Failed", savedCart);
    }
})();
