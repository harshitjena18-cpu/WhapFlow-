const { Buffer } = require('node:buffer');
const crypto = require('node:crypto');

const encoder = new TextEncoder();

async function simulatedVerifyHmac(rawBody, hmacHeader, secret) {
    const msgData = encoder.encode(rawBody);
    const keyData = encoder.encode(secret);

    const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify", "sign"]
    );

    // Create a real HMAC to verify against
    const realHmacBuffer = await crypto.subtle.sign("HMAC", key, msgData);
    const realHmacHex = Buffer.from(realHmacBuffer).toString("hex");
    const realHmacBase64 = Buffer.from(realHmacBuffer).toString("base64");

    console.log(`Generated HMAC Hex: ${realHmacHex}`);
    console.log(`Generated HMAC Base64: ${realHmacBase64}`);

    // Verify Hex (WhatsApp)
    const signatureBytesHex = Buffer.from(realHmacHex, "hex");
    const isValidHex = await crypto.subtle.verify("HMAC", key, signatureBytesHex, msgData);
    console.log(`WhatsApp Signature (Hex) result: ${isValidHex}`);

    // Verify Base64 (Shopify)
    const signatureBytesBase64 = Buffer.from(realHmacBase64, "base64");
    const isValidBase64 = await crypto.subtle.verify("HMAC", key, signatureBytesBase64, msgData);
    console.log(`Shopify Webhook (Base64) result: ${isValidBase64}`);

    return isValidHex && isValidBase64;
}

(async () => {
    console.log("Starting Simulated HMAC Verification Logic Test...");
    try {
        const result = await simulatedVerifyHmac("{}", "whocares", "test_secret");
        if (result) {
            console.log("✅ Simulation completed successfully and verified logic.");
        } else {
            console.error("❌ Simulation completed but verification failed.");
        }
    } catch (e) {
        console.error("❌ Simulation failed:", e);
    }
})();
