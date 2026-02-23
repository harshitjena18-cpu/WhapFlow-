// scripts/verify_batched_webhook.ts

// Mock KV
const kv = {
  data: new Map<string, any>(),
  async mget(keys: string[]) {
    // Return objects by value (cloned) to simulate DB
    return keys.map(k => {
        const val = this.data.get(k);
        return val ? JSON.parse(JSON.stringify(val)) : null;
    });
  },
  async mset(keys: string[], values: any[]) {
    keys.forEach((k, i) => this.data.set(k, values[i]));
  }
};

interface WhatsAppStatus {
  id: string;
  status: string;
}

// Optimized Implementation (matching src/supabase/functions/server/automation.ts)
async function processWhatsAppStatuses(statuses: WhatsAppStatus[]) {
  if (statuses.length === 0) return;

  // PERFORMANCE: Batch fetch all cart ID mappings in a single request (Single pass map)
  const msgMapKeys = statuses.map(s => `msg_map:${s.id}`);
  const cartIds = await kv.mget(msgMapKeys);

  // Map cartId -> newStatus. Last update wins if duplicates exist.
  const updatesByCartId = new Map<string, string>();

  for (let i = 0; i < statuses.length; i++) {
    const cartId = cartIds[i];
    if (cartId) {
      updatesByCartId.set(String(cartId), statuses[i].status);
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
      }
    }
  }

  // PERFORMANCE: Batch persist only unique updated carts
  if (updateKeys.length > 0) {
    await kv.mset(updateKeys, updateValues);
  }
}

(async () => {
  console.log("Testing batched WhatsApp status processing (Optimized Logic)...");

  // Setup initial data
  kv.data.set("msg_map:wamid.1", "cart_A");
  kv.data.set("msg_map:wamid.2", "cart_B");
  kv.data.set("msg_map:wamid.3", "cart_C");

  kv.data.set("abandoned_cart:cart_A", { id: "cart_A", delivery_status: "pending" });
  kv.data.set("abandoned_cart:cart_B", { id: "cart_B", delivery_status: "delivered" });
  kv.data.set("abandoned_cart:cart_C", { id: "cart_C", delivery_status: "pending" });

  const mockStatuses = [
    { id: "wamid.1", status: "delivered" },
    { id: "wamid.2", status: "read" },
    { id: "wamid.3", status: "sent" }
  ];

  await processWhatsAppStatuses(mockStatuses);

  const cartA = kv.data.get("abandoned_cart:cart_A");
  const cartB = kv.data.get("abandoned_cart:cart_B");
  const cartC = kv.data.get("abandoned_cart:cart_C");

  console.log("Cart A status:", cartA.delivery_status);
  console.log("Cart B status:", cartB.delivery_status);
  console.log("Cart C status:", cartC.delivery_status);

  let success = true;
  if (cartA.delivery_status !== "delivered") success = false;
  if (cartB.delivery_status !== "read") success = false;
  if (cartC.delivery_status !== "sent") success = false;

  if (success) {
    console.log("✅ Batched processing verification successful!");
  } else {
    console.error("❌ Batched processing verification failed!");
    process.exit(1);
  }
})();
