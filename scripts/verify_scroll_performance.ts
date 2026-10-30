// scripts/verify_scroll_performance.ts
import { readFileSync } from 'node:fs';

const headerContent = readFileSync('src/components/Header.tsx', 'utf-8');
const landingContent = readFileSync('src/components/LandingPagePremium.tsx', 'utf-8');

function verifyScrollThrottling() {
  console.log("=== Verifying Scroll Throttling Optimization ===");

  const headerPass =
    headerContent.includes('requestAnimationFrame') &&
    headerContent.includes('{ passive: true }') &&
    headerContent.includes('cancelAnimationFrame');

  const landingPass =
    landingContent.includes('requestAnimationFrame') &&
    landingContent.includes('{ passive: true }') &&
    landingContent.includes('cancelAnimationFrame');

  console.log(`Header.tsx Throttled: ${headerPass}`);
  console.log(`LandingPagePremium.tsx Throttled: ${landingPass}`);

  if (headerPass && landingPass) {
    console.log("✅ Scroll throttling verification passed!");
  } else {
    console.error("❌ Scroll throttling verification failed!");
    process.exit(1);
  }
}

verifyScrollThrottling();
