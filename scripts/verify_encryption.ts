import { encrypt, decrypt } from "../src/supabase/functions/server/crypto.ts";
// import { webcrypto } from "node:crypto"; // Not needed in Node 22+ with global crypto

// Mock Deno global for Node.js environment
// @ts-ignore: Mocking Deno
global.Deno = {
  env: {
    get: (key: string) => process.env[key]
  }
};

// Set test secret
process.env.ENCRYPTION_SECRET = "test-encryption-secret-key-12345";

async function runTests() {
  console.log("Running Encryption/Decryption Verification Tests...");

  // Test 1: Successful encryption and decryption
  const originalText = "shpat_1234567890abcdef";
  console.log(`Test 1: Encrypting '${originalText}'`);

  const encrypted = await encrypt(originalText);
  console.log(`Encrypted: ${encrypted}`);

  if (!encrypted?.startsWith("enc:v2:")) {
    console.error("❌ Test 1 Failed: Encrypted text should start with 'enc:v2:'");
    process.exit(1);
  }

  const decrypted = await decrypt(encrypted);
  console.log(`Decrypted: ${decrypted}`);

  if (decrypted === originalText) {
    console.log("✅ Test 1 Passed: Encryption and decryption match");
  } else {
    console.error(`❌ Test 1 Failed: Expected ${originalText}, got ${decrypted}`);
    process.exit(1);
  }

  // Test 2: Backward compatibility (Plaintext)
  const plaintext = "legacy_plaintext_token";
  console.log(`Test 2: Decrypting plaintext '${plaintext}'`);
  const decryptedPlain = await decrypt(plaintext);

  if (decryptedPlain === plaintext) {
    console.log("✅ Test 2 Passed: Plaintext returned as-is");
  } else {
    console.error(`❌ Test 2 Failed: Expected ${plaintext}, got ${decryptedPlain}`);
    process.exit(1);
  }

  // Test 3: Null/Undefined handling
  console.log("Test 3: Handling null/undefined");
  const nullResult = await encrypt(null);
  const undefinedResult = await decrypt(undefined);

  if (nullResult === null && undefinedResult === undefined) {
    console.log("✅ Test 3 Passed: Null/Undefined handled correctly");
  } else {
    console.error("❌ Test 3 Failed: Null/Undefined not preserved");
    process.exit(1);
  }

  // Test 4: Different secret leads to decryption failure (returns input)
  console.log("Test 4: Decryption with wrong secret");
  // Re-encrypt with known secret first
  const encryptedWithCorrect = await encrypt("secret_data");
  // Change secret
  process.env.ENCRYPTION_SECRET = "wrong-secret";

  const decryptedWithWrong = await decrypt(encryptedWithCorrect);
  if (decryptedWithWrong === encryptedWithCorrect) {
    console.log("✅ Test 4 Passed: Returns input on decryption failure (Graceful degradation)");
  } else {
    console.error("❌ Test 4 Failed: Should have returned original encrypted string on failure");
    process.exit(1);
  }

  console.log("\n✨ All encryption tests passed!");
}

runTests().catch(err => {
  console.error("🔥 Test suite failed with error:", err);
  process.exit(1);
});
