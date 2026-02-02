
import { performance } from 'perf_hooks';

// Mock KV Store with simulated latency
const LATENCY_MS = 50;

const mockKv = {
  get: async (key: string) => {
    await new Promise(resolve => setTimeout(resolve, LATENCY_MS));
    if (key.startsWith('msg_map:')) {
      return "cart_123";
    }
    if (key.startsWith('abandoned_cart:')) {
      return {
        id: "cart_123",
        delivery_status: "sent",
        updated_at: new Date().toISOString()
      };
    }
    return null;
  },
  set: async (key: string, value: any) => {
    await new Promise(resolve => setTimeout(resolve, LATENCY_MS));
  }
};

// Logic from src/supabase/functions/server/index.tsx
async function processWhatsAppStatus(status: any) {
  const wamid = status.id;
  const newStatus = status.status;

  // Find the cart associated with this message
  const cartId = await mockKv.get(`msg_map:${wamid}`);

  if (!cartId) {
    return;
  }

  // Update Cart Status
  const cartKey = `abandoned_cart:${cartId}`;
  const cart = await mockKv.get(cartKey);

  if (cart) {
    cart.delivery_status = newStatus;
    cart.updated_at = new Date().toISOString();
    await mockKv.set(cartKey, cart);
  }
}

async function runBenchmark() {
  console.log("⚡ Benchmarking WhatsApp Status Processing");
  console.log(`   Simulated I/O Latency: ${LATENCY_MS}ms per operation`);
  console.log(`   Operations per status: 3 (get map + get cart + set cart) = ~${LATENCY_MS * 3}ms serial overhead`);

  const BATCH_SIZE = 10;
  const statuses = Array.from({ length: BATCH_SIZE }, (_, i) => ({
    id: `wamid_test_${i}`,
    status: 'read'
  }));

  console.log(`\n📋 Processing ${BATCH_SIZE} status updates...`);

  // --- SEQUENTIAL ---
  const startSeq = performance.now();
  for (const status of statuses) {
    await processWhatsAppStatus(status);
  }
  const endSeq = performance.now();
  const timeSeq = endSeq - startSeq;
  console.log(`\n🐌 Sequential Time: ${timeSeq.toFixed(2)}ms`);

  // --- PARALLEL ---
  const startPar = performance.now();
  await Promise.all(statuses.map(status => processWhatsAppStatus(status)));
  const endPar = performance.now();
  const timePar = endPar - startPar;
  console.log(`🚀 Parallel Time:   ${timePar.toFixed(2)}ms`);

  // --- RESULTS ---
  const improvement = timeSeq / timePar;
  console.log(`\n📊 Improvement: ${improvement.toFixed(2)}x faster`);
}

runBenchmark();
