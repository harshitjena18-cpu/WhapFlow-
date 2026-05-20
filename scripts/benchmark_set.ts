const APP_DOMAIN = "https://whapflow.vercel.app";
const API_DOMAIN = "https://vwzmauqhnrnsqqergsgs.supabase.co";
const ALLOWED_ORIGINS = new Set([APP_DOMAIN, API_DOMAIN]);

const iterations = 10_000_000;
const origin = APP_DOMAIN;

console.log("Benchmarking Set vs IF...");

const startIf = performance.now();
for (let i = 0; i < iterations; i++) {
  if (origin === APP_DOMAIN || origin === API_DOMAIN) {
    // match
  }
}
const endIf = performance.now();
console.log(`If: ${(endIf - startIf).toFixed(2)}ms`);

const startSet = performance.now();
for (let i = 0; i < iterations; i++) {
  if (ALLOWED_ORIGINS.has(origin)) {
    // match
  }
}
const endSet = performance.now();
console.log(`Set: ${(endSet - startSet).toFixed(2)}ms`);
