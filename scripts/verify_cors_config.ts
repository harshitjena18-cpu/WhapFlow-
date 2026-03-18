import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function verify() {
  const path = resolve("src/supabase/functions/server/index.tsx");
  const content = await readFile(path, "utf-8");

  // We are checking for the presence of code patterns.
  // Since we are reading the file directly, we can just use string.includes for simple checks,
  // or simple regex.

  const checks = [
    {
      // Check import
      pattern: 'import {.*APP_DOMAIN.*LOCALHOST_REGEX.*} from "./constants.ts"',
      description: "Imports APP_DOMAIN and LOCALHOST_REGEX",
      useRegex: true
    },
    {
      // Check origin function
      pattern: 'origin: (origin) => {',
      description: "Uses dynamic origin function",
      useRegex: false
    },
    {
      pattern: 'if (origin === APP_DOMAIN)',
      description: "Allows APP_DOMAIN",
      useRegex: false
    },
    {
      pattern: 'if (LOCALHOST_REGEX.test(origin))',
      description: "Allows localhost via secure regex",
      useRegex: false
    },
    {
      pattern: 'return undefined;',
      description: "Blocks other origins by returning undefined",
      useRegex: false
    },
    {
      pattern: 'if (!origin) return origin;',
      description: "Allows no-origin (server-to-server) requests",
      useRegex: false
    },
    {
      pattern: 'if (import.meta.main)',
      description: "Uses import.meta.main for Deno.serve",
      useRegex: false
    },
  ];

  let passed = true;
  for (const check of checks) {
    if (check.useRegex) {
      const regex = new RegExp(check.pattern);
      if (!regex.test(content)) {
        console.error(`❌ Check failed: ${check.description}`);
        passed = false;
      } else {
        console.log(`✅ Check passed: ${check.description}`);
      }
    } else {
      if (!content.includes(check.pattern)) {
        console.error(`❌ Check failed: ${check.description} (Expected: '${check.pattern}')`);
        passed = false;
      } else {
        console.log(`✅ Check passed: ${check.description}`);
      }
    }
  }

  if (content.includes('origin: "*"')) {
    console.error(`❌ Check failed: Still contains 'origin: "*"'`);
    passed = false;
  } else {
      console.log(`✅ Check passed: 'origin: "*"' is removed`);
  }

  if (content.includes('origin.startsWith("http://localhost:")')) {
    console.error(`❌ Check failed: Still contains insecure 'origin.startsWith("http://localhost:")'`);
    passed = false;
  } else {
    console.log(`✅ Check passed: Insecure localhost check removed`);
  }

  if (passed) {
    console.log("🎉 CORS Configuration Verification Passed!");
    process.exit(0);
  } else {
    console.error("🔥 CORS Configuration Verification Failed!");
    process.exit(1);
  }
}

verify();
