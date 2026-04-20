
// scripts/verify_hmac_performance.ts
import { Buffer } from "node:buffer";

const encoder = new TextEncoder();
const hmacHex = "a800e0b355d08311545627259f935395655513271161d76378e9389f7f4577f8";

function manualHexToBytes(hmac: string) {
  const hmacBytes = new Uint8Array(hmac.length / 2);
  for (let i = 0; i < hmac.length; i += 2) {
    hmacBytes[i / 2] = parseInt(hmac.substring(i, i + 2), 16);
  }
  return hmacBytes;
}

function bufferHexToBytes(hmac: string) {
  return Buffer.from(hmac, "hex");
}

async function runBenchmark() {
  const iterations = 100000;

  console.log(`🚀 Starting HMAC Conversion Benchmark (${iterations} iterations)...`);

  // Warmup
  manualHexToBytes(hmacHex);
  bufferHexToBytes(hmacHex);

  const startManual = performance.now();
  for (let i = 0; i < iterations; i++) {
    manualHexToBytes(hmacHex);
  }
  const endManual = performance.now();
  const manualTime = endManual - startManual;

  const startBuffer = performance.now();
  for (let i = 0; i < iterations; i++) {
    bufferHexToBytes(hmacHex);
  }
  const endBuffer = performance.now();
  const bufferTime = endBuffer - startBuffer;

  console.log(`📊 Benchmark Results:`);
  console.log(`   - Manual Loop: ${manualTime.toFixed(2)}ms`);
  console.log(`   - Buffer.from: ${bufferTime.toFixed(2)}ms`);
  console.log(`   - Speedup: ${(manualTime / bufferTime).toFixed(2)}x faster`);

  // Verification
  const manualRes = manualHexToBytes(hmacHex);
  const bufferRes = bufferHexToBytes(hmacHex);
  let match = manualRes.length === bufferRes.length;
  if (match) {
    for (let i = 0; i < manualRes.length; i++) {
      if (manualRes[i] !== bufferRes[i]) {
        match = false;
        break;
      }
    }
  }

  if (match) {
    console.log("✅ VERIFICATION SUCCESS: Both methods produce identical bytes.");
  } else {
    console.error("❌ VERIFICATION FAILED: Results do not match.");
    process.exit(1);
  }
}

// Mocking HMAC verification logic verification
async function verifyHmacLogic() {
    const secret = "hush";
    const rawBody = '{"foo":"bar"}';
    const msgData = encoder.encode(rawBody);

    // Simulate CryptoKey import
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, msgData);
    const signatureHex = Buffer.from(signature).toString("hex");
    const signatureB64 = Buffer.from(signature).toString("base64");

    console.log(`\n🧪 Testing HMAC Logic with hex/b64 conversion...`);

    // Test Hex (OAuth Style)
    const hexBytes = Buffer.from(signatureHex, "hex");
    const isValidHex = await crypto.subtle.verify("HMAC", key, hexBytes, msgData);
    console.log(`   - Hex Verification (OAuth style): ${isValidHex ? "✅ PASSED" : "❌ FAILED"}`);

    // Test Base64 (Webhook Style)
    const b64Bytes = Buffer.from(signatureB64, "base64");
    const isValidB64 = await crypto.subtle.verify("HMAC", key, b64Bytes, msgData);
    console.log(`   - Base64 Verification (Webhook style): ${isValidB64 ? "✅ PASSED" : "❌ FAILED"}`);

    if (!isValidHex || !isValidB64) {
        process.exit(1);
    }
}

(async () => {
    await runBenchmark();
    await verifyHmacLogic();
})();
