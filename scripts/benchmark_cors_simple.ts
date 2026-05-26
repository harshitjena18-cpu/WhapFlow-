import { APP_DOMAIN, API_DOMAIN, LOCALHOST_REGEX } from "../src/supabase/functions/server/constants.ts";

const origin = APP_DOMAIN;

function currentCORS(origin: string) {
  if (!origin) return origin;
  if (LOCALHOST_REGEX.test(origin)) return origin;
  if (origin === APP_DOMAIN) return origin;
  if (origin === API_DOMAIN) return origin;
  return undefined;
}

function optimizedCORS(origin: string) {
  if (!origin) return origin;
  if (origin === APP_DOMAIN) return origin;
  if (origin === API_DOMAIN) return origin;
  if (LOCALHOST_REGEX.test(origin)) return origin;
  return undefined;
}

const iterations = 1000000;

console.log("⚡ Benchmarking CORS Origin Checks (Production Traffic)...");

// Warm up
for (let i = 0; i < 10000; i++) {
  currentCORS(origin);
  optimizedCORS(origin);
}

const startCurrent = performance.now();
for (let i = 0; i < iterations; i++) {
  currentCORS(origin);
}
const endCurrent = performance.now();

const startOptimized = performance.now();
for (let i = 0; i < iterations; i++) {
  optimizedCORS(origin);
}
const endOptimized = performance.now();

console.log(`Current Implementation:  ${(endCurrent - startCurrent).toFixed(2)}ms`);
console.log(`Optimized Implementation: ${(endOptimized - startOptimized).toFixed(2)}ms`);
console.log(`Improvement: ${(((endCurrent - startCurrent) - (endOptimized - startOptimized)) / (endCurrent - startCurrent) * 100).toFixed(2)}%`);
