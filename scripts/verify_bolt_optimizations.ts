
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";

/**
 * Benchmark manual hex-to-Uint8Array loop vs Buffer.from
 */
function benchmarkHexConversion() {
  const hmac = "2d711642b726b04401627ca9fbac32f5c8530fb1903cc4db02258717921a4881";
  const iterations = 100000;

  console.log(`--- Benchmarking Hex Conversion (${iterations} iterations) ---`);

  // Manual Loop
  const startManual = performance.now();
  for (let j = 0; j < iterations; j++) {
    const hmacBytes = new Uint8Array(hmac.length / 2);
    for (let i = 0; i < hmac.length; i += 2) {
      hmacBytes[i / 2] = parseInt(hmac.substring(i, i + 2), 16);
    }
  }
  const endManual = performance.now();
  console.log(`Manual Loop:   ${(endManual - startManual).toFixed(4)}ms`);

  // Buffer.from
  const startBuffer = performance.now();
  for (let j = 0; j < iterations; j++) {
    const hmacBytes = Buffer.from(hmac, "hex");
  }
  const endBuffer = performance.now();
  console.log(`Buffer.from:   ${(endBuffer - startBuffer).toFixed(4)}ms`);

  const speedup = ((endManual - startManual) / (endBuffer - startBuffer)).toFixed(2);
  console.log(`Speedup:       ${speedup}x\n`);
}

/**
 * Verify ReferenceError in shopify_client.ts
 */
function verifyReferenceError() {
  console.log("--- Verifying ReferenceError in shopify_client.ts ---");
  try {
    const content = readFileSync("src/supabase/functions/server/shopify_client.ts", "utf8");
    const hasEncoder = content.includes("const encoder = new TextEncoder();");
    const hasReferenceToENCODER = content.includes("ENCODER.encode(secret)");

    if (hasEncoder && hasReferenceToENCODER) {
      console.log("❌ FOUND ReferenceError: 'ENCODER' is used but 'encoder' is defined.");
    } else {
      console.log("✅ No ReferenceError found regarding 'ENCODER'.");
    }

    // Check for duplicate/conflicting logic blocks
    const importKeyBlocks = content.split("crypto.subtle.importKey").length - 1;
    if (importKeyBlocks > 1) {
      console.log(`❌ FOUND Duplicate Key Import Logic: ${importKeyBlocks} blocks found in verifyWebhookHmac.`);
    }

  } catch (e) {
    console.error("Error reading shopify_client.ts:", e);
  }
}

benchmarkHexConversion();
verifyReferenceError();
