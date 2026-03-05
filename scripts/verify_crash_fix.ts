
async function runVerification() {
  console.log("🔍 Verifying ReferenceError fix via static analysis...");

  const fs = await import('node:fs');
  const indexFile = fs.readFileSync('src/supabase/functions/server/index.tsx', 'utf8');
  const routesFile = fs.readFileSync('src/supabase/functions/server/whatsapp_routes.tsx', 'utf8');

  let failed = false;

  if (indexFile.includes('isServiceAuth')) {
      console.error("❌ Verification Failed: isServiceAuth still present in index.tsx");
      failed = true;
  }
  if (indexFile.includes('isWhatsappAuth')) {
      console.error("❌ Verification Failed: isWhatsappAuth still present in index.tsx");
      failed = true;
  }

  if (routesFile.includes('isServiceAuth')) {
      console.error("❌ Verification Failed: isServiceAuth still present in whatsapp_routes.tsx");
      failed = true;
  }
  if (routesFile.includes('isWhatsappAuth')) {
      console.error("❌ Verification Failed: isWhatsappAuth still present in whatsapp_routes.tsx");
      failed = true;
  }

  if (failed) {
      process.exit(1);
  }

  console.log("✅ Verification Passed: Problemetic variables removed from source files.");
}

runVerification();
