import { performance } from 'node:perf_hooks';

interface WhatsAppStatus {
  id: string;
  status: string;
}

// Mock Data
const mockDataStore: Record<string, any> = {};
const TOTAL_CARTS = 5000;

for (let i = 0; i < TOTAL_CARTS; i++) {
    const cartId = `cart_${i}`;
    const wamid = `wamid_${i}`;
    mockDataStore[`msg_map:${wamid}`] = cartId;
    mockDataStore[`abandoned_cart:${cartId}`] = {
        id: cartId,
        delivery_status: 'sent',
        updated_at: 'old_date',
        payload: 'x'.repeat(1000) // Simulate large object
    };
}

let mgetCallCount = 0;
let mgetKeysCount = 0;
let msetCallCount = 0;
let msetKeysCount = 0;

const mockKV = {
    mget: async (keys: string[]) => {
        mgetCallCount++;
        mgetKeysCount += keys.length;
        // Simulate serialization overhead
        const result = keys.map(k => mockDataStore[k] ? JSON.parse(JSON.stringify(mockDataStore[k])) : null);
        return result;
    },
    mset: async (keys: string[], values: any[]) => {
        msetCallCount++;
        msetKeysCount += keys.length;
        // Simulate serialization overhead
        keys.forEach((k, i) => {
            mockDataStore[k] = JSON.parse(JSON.stringify(values[i]));
        });
    }
};

function resetMetrics() {
    mgetCallCount = 0;
    mgetKeysCount = 0;
    msetCallCount = 0;
    msetKeysCount = 0;
}

// Original Function
async function processWhatsAppStatusesOriginal(statuses: WhatsAppStatus[]) {
  if (statuses.length === 0) return;

  const wamids = statuses.map(s => s.id);
  const msgMapKeys = wamids.map(id => `msg_map:${id}`);

  // PERFORMANCE: Batch fetch all cart ID mappings in a single request
  const cartIds = await mockKV.mget(msgMapKeys);

  const validUpdates: { cartId: string, newStatus: string }[] = [];
  const cartKeys: string[] = [];

  for (let i = 0; i < statuses.length; i++) {
    const cartId = cartIds[i];
    if (cartId) {
      validUpdates.push({ cartId, newStatus: statuses[i].status });
      cartKeys.push(`abandoned_cart:${cartId}`);
    }
  }

  if (cartKeys.length === 0) return;

  // PERFORMANCE: Batch fetch all associated carts in a single request
  const carts = await mockKV.mget(cartKeys);

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
    await mockKV.mset(updateKeys, updateValues);
  }
}

// Optimized Function
async function processWhatsAppStatusesOptimized(statuses: WhatsAppStatus[]) {
  if (statuses.length === 0) return;

  const msgMapKeys = statuses.map(s => `msg_map:${s.id}`);
  const cartIds = await mockKV.mget(msgMapKeys);

  // Map cartId -> newStatus. Last update wins.
  const updatesByCartId = new Map<string, string>();

  for (let i = 0; i < statuses.length; i++) {
    const cartId = cartIds[i];
    if (cartId) {
      updatesByCartId.set(cartId, statuses[i].status);
    }
  }

  if (updatesByCartId.size === 0) return;

  const uniqueCartIds = Array.from(updatesByCartId.keys());
  const uniqueCartKeys = uniqueCartIds.map(id => `abandoned_cart:${id}`);

  const carts = await mockKV.mget(uniqueCartKeys);

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

  if (updateKeys.length > 0) {
    await mockKV.mset(updateKeys, updateValues);
  }
}

async function runBenchmark() {
    const ITERATIONS = 10; // Reduce iterations due to JSON serialization overhead
    const BATCH_SIZE = 1000;

    // Generate test data where all statuses target only 10 unique carts
    // This simulates high contention / duplicate updates
    const statuses: WhatsAppStatus[] = [];
    for(let i=0; i<BATCH_SIZE; i++) {
        const idIndex = i % 10; // 1000 items targeting 10 carts = 100 duplicates per cart
        statuses.push({
            id: `wamid_${idIndex}`, // Reuse wamids? No, different wamids can map to same cart?
            // Wait, my mock msg_map is 1-to-1 wamid->cartId.
            // If I want many updates to same cart, I need many wamids mapping to same cart.
            status: i % 2 === 0 ? 'read' : 'delivered'
        });
    }

    // Fix mock data so many wamids map to few carts
    for(let i=0; i<BATCH_SIZE; i++) {
        const wamid = `wamid_many_${i}`;
        const cartId = `cart_${i % 10}`; // 10 carts
        mockDataStore[`msg_map:${wamid}`] = cartId;
        statuses[i] = { id: wamid, status: 'read' };
    }

    console.log(`Running benchmark with ${BATCH_SIZE} items targeting 10 unique carts (High Deduplication Potential)...`);

    // Measure Original
    resetMetrics();
    const startOrig = performance.now();
    for(let i=0; i<ITERATIONS; i++) {
        await processWhatsAppStatusesOriginal(statuses);
    }
    const timeOrig = performance.now() - startOrig;
    const metricsOrig = { mget: mgetKeysCount, mset: msetKeysCount };

    // Measure Optimized
    resetMetrics();
    const startOpt = performance.now();
    for(let i=0; i<ITERATIONS; i++) {
        await processWhatsAppStatusesOptimized(statuses);
    }
    const timeOpt = performance.now() - startOpt;
    const metricsOpt = { mget: mgetKeysCount, mset: msetKeysCount };

    console.log(`Original Time:  ${timeOrig.toFixed(2)}ms`);
    console.log(`Optimized Time: ${timeOpt.toFixed(2)}ms`);
    console.log(`DB Keys Read (mget):  ${metricsOrig.mget} -> ${metricsOpt.mget} (${((metricsOpt.mget - metricsOrig.mget)/metricsOrig.mget*100).toFixed(2)}%)`);
    console.log(`DB Keys Written (mset): ${metricsOrig.mset} -> ${metricsOpt.mset} (${((metricsOpt.mset - metricsOrig.mset)/metricsOrig.mset*100).toFixed(2)}%)`);
}

runBenchmark();
