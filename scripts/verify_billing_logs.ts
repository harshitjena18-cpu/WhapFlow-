import fs from 'node:fs';
import path from 'node:path';

const filePath = path.join(process.cwd(), 'src/supabase/functions/server/billing_routes.tsx');

try {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Regex to find console.log calls that start with [Billing] inside a template literal (backticks) or string (quotes)
  // Matches: console.log(`[Billing...`) or console.log("[Billing...") or console.log('[Billing...')
  const unstructuredLogRegex = /console\.log\([`'"]\[Billing/;

  if (unstructuredLogRegex.test(content)) {
    console.error('❌ Found unstructured console.log calls in billing_routes.tsx');
    console.error('Matches found:');
    const matches = content.match(unstructuredLogRegex);
    console.error(matches);
    process.exit(1);
  }

  // Check for JSON.stringify usage inside console.info or console.log
  const structuredLogRegex = /console\.(info|log)\(JSON\.stringify\(/;

  if (!structuredLogRegex.test(content)) {
    console.error('❌ No structured logging (JSON.stringify) found.');
    process.exit(1);
  }

  console.log('✅ Verification passed: No unstructured console.log calls found and structured logging is present.');
} catch (error) {
  console.error('Error verifying logs:', error);
  process.exit(1);
}
