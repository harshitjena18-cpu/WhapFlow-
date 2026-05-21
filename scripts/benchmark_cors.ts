
import { performance } from 'perf_hooks';

// Mocks from src/supabase/functions/server/constants.ts
const APP_DOMAIN = "https://app.whapflow.com";
const API_DOMAIN = "https://api.whapflow.com";
const LOCALHOST_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

function oldOriginCheck(origin: string | undefined) {
  if (!origin) return origin;
  if (LOCALHOST_REGEX.test(origin)) {
    return origin;
  }
  if (origin === APP_DOMAIN) {
    return origin;
  }
  if (origin === API_DOMAIN) {
    return origin;
  }
  return undefined;
}

function newOriginCheck(origin: string | undefined) {
  if (!origin) return origin;
  if (origin === APP_DOMAIN) {
    return origin;
  }
  if (origin === API_DOMAIN) {
    return origin;
  }
  if (LOCALHOST_REGEX.test(origin)) {
    return origin;
  }
  return undefined;
}

function runBenchmark() {
  const iterations = 1_000_000;
  const productionOrigin = APP_DOMAIN;

  console.log(`⚡ Benchmarking CORS Origin Check (${iterations.toLocaleString()} iterations)`);
  console.log(`   Target Origin: ${productionOrigin} (Production path)`);

  // --- OLD CHECK (Regex First) ---
  const startOld = performance.now();
  for (let i = 0; i < iterations; i++) {
    oldOriginCheck(productionOrigin);
  }
  const endOld = performance.now();
  const timeOld = endOld - startOld;
  console.log(`\n🐌 Old Check (Regex First): ${timeOld.toFixed(2)}ms`);

  // --- NEW CHECK (Static First) ---
  const startNew = performance.now();
  for (let i = 0; i < iterations; i++) {
    newOriginCheck(productionOrigin);
  }
  const endNew = performance.now();
  const timeNew = endNew - startNew;
  console.log(`🚀 New Check (Static First): ${timeNew.toFixed(2)}ms`);

  // --- RESULTS ---
  const improvement = timeOld / timeNew;
  const reduction = ((timeOld - timeNew) / timeOld) * 100;
  console.log(`\n📊 Improvement: ${improvement.toFixed(2)}x faster`);
  console.log(`📉 Latency Reduction: ${reduction.toFixed(2)}%`);
}

runBenchmark();
