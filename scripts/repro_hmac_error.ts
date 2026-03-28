
import { verifyWebhookHmac } from "../src/supabase/functions/server/shopify_client.ts";

async function test() {
  try {
    console.log("Testing verifyWebhookHmac...");
    // This should trigger the ReferenceError if ENCODER is used but not defined
    const result = await verifyWebhookHmac("test", "test", "test");
    console.log("Result:", result);
  } catch (error) {
    console.error("Caught error:", error);
  }
}

test();
