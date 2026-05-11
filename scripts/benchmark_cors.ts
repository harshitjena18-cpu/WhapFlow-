const APP_DOMAIN = "https://app.whapflow.com";
const API_DOMAIN = "https://api.whapflow.com";
const LOCALHOST_REGEX = /^https?:\/\/(localhost|127.0.0.1|[::1])(:\d+)?$/;

const iterations = 1000000;
const testOrigin = "https://app.whapflow.com";

console.log(`Benchmarking CORS origin check with ${iterations} iterations...`);

function original(origin: string) {
  if (!origin) return origin;
  if (LOCALHOST_REGEX.test(origin)) return origin;
  if (origin === APP_DOMAIN) return origin;
  if (origin === API_DOMAIN) return origin;
  return undefined;
}

function optimized(origin: string) {
  if (!origin) return origin;
  if (origin === APP_DOMAIN) return origin;
  if (origin === API_DOMAIN) return origin;
  if (LOCALHOST_REGEX.test(origin)) return origin;
  return undefined;
}

// Warm up
for (let i = 0; i < 100000; i++) {
  original(testOrigin);
  optimized(testOrigin);
}

const startOrig = performance.now();
for (let i = 0; i < iterations; i++) {
  original(testOrigin);
}
const endOrig = performance.now();

const startOpt = performance.now();
for (let i = 0; i < iterations; i++) {
  optimized(testOrigin);
}
const endOpt = performance.now();

console.log(`Original time: ${(endOrig - startOrig).toFixed(2)}ms`);
console.log(`Optimized time: ${(endOpt - startOpt).toFixed(2)}ms`);
console.log(`Improvement: ${(((endOrig - startOrig) - (endOpt - startOpt)) / (endOrig - startOrig) * 100).toFixed(2)}%`);
