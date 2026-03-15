import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function verify() {
  const files = [
    "src/supabase/functions/server/whatsapp_routes.tsx",
    "src/supabase/functions/server/index.tsx"
  ];

  let foundIssues = false;

  for (const file of files) {
    const path = resolve(file);
    const content = await readFile(path, "utf-8");

    if (content.includes("isServiceAuth") || content.includes("isWhatsappAuth")) {
      console.error(`❌ Found undefined variables (isServiceAuth/isWhatsappAuth) in ${file}`);
      foundIssues = true;
    } else {
      console.log(`✅ No undefined auth variables found in ${file}`);
    }
  }

  if (foundIssues) {
    process.exit(1);
  } else {
    console.log("🎉 Reference error check passed!");
    process.exit(0);
  }
}

verify();
