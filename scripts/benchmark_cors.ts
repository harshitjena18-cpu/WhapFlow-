import { LOCALHOST_REGEX } from "../src/supabase/functions/server/constants.ts";

const APP_DOMAIN = "https://whapflow.vercel.app";
const API_DOMAIN = "https://vwzmauqhnrnsqqergsgs.supabase.co";

const iterations = 1_000_000;
const origin = APP_DOMAIN;

console.log("Benchmarking CORS origin checks...");

// Current implementation
const startCurrent = performance.now();
for (let i = 0; i < iterations; i++) {
  if (!origin) continue;
  if (LOCALHOST_REGEX.test(origin)) {
    // match
  } else if (origin === APP_DOMAIN) {
    // match
  } else if (origin === API_DOMAIN) {
    // match
  }
}
const endCurrent = performance.now();
console.log(`Current (Regex first): ${(endCurrent - startCurrent).toFixed(2)}ms`);

// Optimized implementation
const startOptimized = performance.now();
for (let i = 0; i < iterations; i++) {
  if (!origin) continue;
  if (origin === APP_DOMAIN) {
    // match
  } else if (origin === API_DOMAIN) {
    // match
  } else if (LOCALHOST_REGEX.test(origin)) {
    // match
  }
}
const endOptimized = performance.now();
console.log(`Optimized (Static first): ${(endOptimized - startOptimized).toFixed(2)}ms`);

const improvement = ((endCurrent - startCurrent) - (endOptimized - startOptimized)) / (endCurrent - startCurrent) * 100;
console.log(`Improvement: ${improvement.toFixed(2)}%`);
