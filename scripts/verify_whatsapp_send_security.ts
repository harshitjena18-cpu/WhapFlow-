
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

async function verify() {
  console.log("🧪 Verifying WhatsApp Send Authentication Security...");

  const files = [
    "src/supabase/functions/server/index.tsx",
    "src/supabase/functions/server/whatsapp_routes.tsx"
  ];

  let passed = true;

  for (const file of files) {
    console.log(`\nChecking ${file}...`);
    const content = readFileSync(resolve(file), "utf8");

    const checks = [
      {
        pattern: /if \(!apiKey \|\| !authHeader \|\| authHeader !== `Bearer \${apiKey}`\)/,
        description: "Enforces WHATSAPP_API_KEY and rejects everything else"
      },
      {
        pattern: /isServiceAuth/,
        description: "No insecure service role key fallback (isServiceAuth)",
        shouldExist: false
      },
      {
        pattern: /isWhatsappAuth/,
        description: "No redundant variables (isWhatsappAuth)",
        shouldExist: false
      }
    ];

    for (const check of checks) {
      const exists = check.pattern.test(content);
      const condition = check.shouldExist === false ? !exists : exists;

      if (condition) {
        console.log(`✅ ${check.description}`);
      } else {
        console.error(`❌ ${check.description}`);
        passed = false;
      }
    }
  }

  if (passed) {
    console.log("\n🎉 WhatsApp Send Authentication Security Verification Passed!");
    process.exit(0);
  } else {
    console.error("\n🔥 WhatsApp Send Authentication Security Verification Failed!");
    process.exit(1);
  }
}

verify();
