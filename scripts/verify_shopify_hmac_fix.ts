
import { verifyWebhookHmac } from "../src/supabase/functions/server/shopify_client.ts";

// Mock environment
// @ts-ignore
globalThis.Deno = {
  env: {
    get: (key: string) => process.env[key]
  }
};

async function testHmac() {
    const secret = "test-secret";
    const body = JSON.stringify({ test: "data" });

    // Calculate expected HMAC using Node's crypto for verification
    const crypto = await import("node:crypto");
    const hmac = crypto.createHmac("sha256", secret)
                       .update(body)
                       .digest("base64");

    console.log("Testing HMAC verification...");
    const isValid = await verifyWebhookHmac(body, hmac, secret);

    if (isValid) {
        console.log("✅ HMAC Verification Success!");
    } else {
        console.error("❌ HMAC Verification Failed!");
        process.exit(1);
    }

    // Test Concurrent Requests (Thundering Herd Protection)
    console.log("Testing concurrent HMAC verification (Thundering Herd protection)...");
    const promises = Array.from({ length: 50 }, () => verifyWebhookHmac(body, hmac, secret));
    const results = await Promise.all(promises);

    if (results.every(r => r === true)) {
        console.log("✅ Concurrent HMAC Verification Success!");
    } else {
        console.error("❌ Concurrent HMAC Verification Failed!");
        process.exit(1);
    }
}

testHmac().catch(err => {
    console.error(err);
    process.exit(1);
});
