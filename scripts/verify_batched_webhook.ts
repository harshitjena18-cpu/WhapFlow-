
// scripts/verify_batched_webhook.ts

// Mock KV
const kv = {
  data: new Map<string, any>(),
  async mget(keys: string[]) {
    return keys.map(k => this.data.get(k) ?? null);
  },
  async mset(keys: string[], values: any[]) {
    keys.forEach((k, i) => this.data.set(k, values[i]));
  }
};

// Mock Statuses
const mockStatuses = [
  { id: "wamid.1", status: "delivered" },
  { id: "wamid.2", status: "read" },
  { id: "wamid.3", status: "sent" }
];

// Setup initial data
kv.data.set("msg_map:wamid.1", "cart_A");
kv.data.set("msg_map:wamid.2", "cart_B");
kv.data.set("msg_map:wamid.3", "cart_C");

kv.data.set("abandoned_cart:cart_A", { id: "cart_A", delivery_status: "pending" });
kv.data.set("abandoned_cart:cart_B", { id: "cart_B", delivery_status: "delivered" });
kv.data.set("abandoned_cart:cart_C", { id: "cart_C", delivery_status: "pending" });

// Batched logic (copied from index.tsx)
async function processWhatsAppStatuses(statuses: any[]) {
  if (statuses.length === 0) return;

  const wamids = statuses.map(s => s.id);
  const msgMapKeys = wamids.map(id => `msg_map:${id}`);

  const cartIds = await kv.mget(msgMapKeys);

  const validUpdates: { cartId: string, newStatus: string }[] = [];
  const cartKeys: string[] = [];

  for (let i = 0; i < statuses.length; i++) {
    const cartId = cartIds[i];
    if (cartId) {
      validUpdates.push({ cartId: String(cartId), newStatus: statuses[i].status });
      cartKeys.push(`abandoned_cart:${cartId}`);
    }
  }

  if (cartKeys.length === 0) return;

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
    }
  }

  if (updateKeys.length > 0) {
    await kv.mset(updateKeys, updateValues);
  }
}

(async () => {
  console.log("Testing batched WhatsApp status processing...");
  await processWhatsAppStatuses(mockStatuses);

  const cartA = kv.data.get("abandoned_cart:cart_A");
  const cartB = kv.data.get("abandoned_cart:cart_B");
  const cartC = kv.data.get("abandoned_cart:cart_C");

  console.log("Cart A status:", cartA.delivery_status);
  console.log("Cart B status:", cartB.delivery_status);
  console.log("Cart C status:", cartC.delivery_status);

  if (cartA.delivery_status === "delivered" &&
      cartB.delivery_status === "read" &&
      cartC.delivery_status === "sent") {
    console.log("✅ Batched processing verification successful!");
  } else {
    console.error("❌ Batched processing verification failed!");
    process.exit(1);
  }
})();
