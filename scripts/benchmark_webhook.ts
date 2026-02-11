
const KV_LATENCY = 50; // ms

async function mockKvGet(key: string) {
    await new Promise(resolve => setTimeout(resolve, KV_LATENCY));
    return null;
}

async function mockKvMget(keys: string[]) {
    await new Promise(resolve => setTimeout(resolve, KV_LATENCY));
    return keys.map(() => null);
}

async function mockKvSet(key: string, value: any) {
    await new Promise(resolve => setTimeout(resolve, KV_LATENCY));
}

async function mockKvMset(keys: string[], values: any[]) {
    await new Promise(resolve => setTimeout(resolve, KV_LATENCY));
}

async function mockEncrypt(val: string) {
    await new Promise(resolve => setTimeout(resolve, 5)); // Encryption is fast
    return "encrypted:" + val;
}

async function shopifyWebhookCurrent() {
    const start = Date.now();

    // Deduplication (Sequential)
    await mockKvGet("webhook_id:123");
    await mockKvSet("webhook_id:123", { processed_at: new Date().toISOString() });

    // Encryption
    await Promise.all([
        mockEncrypt("name"),
        mockEncrypt("email"),
        mockEncrypt("phone")
    ]);

    // Save cart (Sequential)
    await mockKvSet("cart:123", {});

    // Automation checks (Parallel)
    await Promise.all([
        mockKvGet("merchant:shop"),
        mockKvGet("config:whatsapp"),
        mockKvGet("config:billing"),
        mockKvGet("templates:shop")
    ]);

    const end = Date.now();
    return end - start;
}

async function shopifyWebhookOptimized() {
    const start = Date.now();

    // 1. Parallelize Deduplication Get with Encryption
    const [alreadyProcessed] = await Promise.all([
        mockKvGet("webhook_id:123"),
        mockEncrypt("name"),
        mockEncrypt("email"),
        mockEncrypt("phone")
    ]);

    // 2. Parallelize All Independent I/O
    await Promise.all([
        mockKvGet("merchant:shop"),
        mockKvGet("config:whatsapp"),
        mockKvGet("config:billing"),
        mockKvGet("templates:shop"),
        mockKvSet("cart:123", {}),
        mockKvSet("webhook_id:123", { processed_at: new Date().toISOString() })
    ]);

    const end = Date.now();
    return end - start;
}

async function uninstallWebhookCurrent() {
    const start = Date.now();

    // Deduplication (Sequential)
    await mockKvGet("webhook_id:123");
    await mockKvSet("webhook_id:123", { processed_at: new Date().toISOString() });

    // Merchant Record (Sequential)
    await mockKvGet("merchant:shop");
    await mockKvSet("merchant:shop", {});

    // Shopify Config (Sequential)
    await mockKvGet("config:shopify");
    await mockKvSet("config:shopify", {});

    const end = Date.now();
    return end - start;
}

async function uninstallWebhookOptimized() {
    const start = Date.now();

    // 1. Batch GET
    await mockKvMget(["webhook_id:123", "merchant:shop", "config:shopify"]);

    // 2. Batch SET
    await mockKvMset(["webhook_id:123", "merchant:shop", "config:shopify"], [{}, {}, {}]);

    const end = Date.now();
    return end - start;
}

async function run() {
    console.log("Running benchmarks with simulated KV latency of " + KV_LATENCY + "ms...");

    const s1 = await shopifyWebhookCurrent();
    const s2 = await shopifyWebhookOptimized();
    console.log(`Shopify Webhook: Current=${s1}ms, Optimized=${s2}ms, Reduction=${s1-s2}ms (${((s1-s2)/s1*100).toFixed(1)}%)`);

    const u1 = await uninstallWebhookCurrent();
    const u2 = await uninstallWebhookOptimized();
    console.log(`Uninstall Webhook: Current=${u1}ms, Optimized=${u2}ms, Reduction=${u1-u2}ms (${((u1-u2)/u1*100).toFixed(1)}%)`);
}

run();
