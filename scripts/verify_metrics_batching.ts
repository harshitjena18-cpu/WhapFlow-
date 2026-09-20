import fs from 'node:fs';
import path from 'node:path';

const metricsPath = path.join(process.cwd(), 'src/supabase/functions/server/metrics_routes.tsx');
const billingPath = path.join(process.cwd(), 'src/supabase/functions/server/billing.ts');

try {
  const metricsContent = fs.readFileSync(metricsPath, 'utf-8');
  const billingContent = fs.readFileSync(billingPath, 'utf-8');

  // Verify that billing.ts exports BILLING_KEY_PREFIX and accepts preFetchedConfig in getBillingConfig
  if (!billingContent.includes('export const BILLING_KEY_PREFIX')) {
    console.error('❌ BILLING_KEY_PREFIX is not exported in billing.ts');
    process.exit(1);
  }

  if (!billingContent.includes('preFetchedConfig?: BillingConfig | null')) {
    console.error('❌ getBillingConfig does not support preFetchedConfig in billing.ts');
    process.exit(1);
  }

  // Verify that metrics_routes.tsx uses kv.mget and preFetchedBilling
  if (!metricsContent.includes('kv.mget([')) {
    console.error('❌ metrics_routes.tsx is not using batched kv.mget');
    process.exit(1);
  }

  if (!metricsContent.includes('billing.BILLING_KEY_PREFIX')) {
    console.error('❌ metrics_routes.tsx is not using billing.BILLING_KEY_PREFIX');
    process.exit(1);
  }

  if (!metricsContent.includes('billing.getBillingConfig(shop, preFetchedBilling')) {
    console.error('❌ metrics_routes.tsx is not passing preFetchedBilling to getBillingConfig');
    process.exit(1);
  }

  console.log('✅ Verification passed: metrics_routes.tsx and billing.ts correctly implement batched KV lookups with pre-fetched billing config.');
} catch (error) {
  console.error('Error verifying metrics batching:', error);
  process.exit(1);
}
