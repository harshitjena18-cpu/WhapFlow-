/**
 * Crypto utility for encrypting and decrypting sensitive data at rest.
 * Uses AES-GCM with a key derived from environment secrets.
 */

const ALGORITHM = "AES-GCM";
const PREFIX_V1 = "enc:v1:";
const PREFIX_V2 = "enc:v2:";

// PERFORMANCE: Cache the derived CryptoKey to avoid redundant hashing and key import operations
let _cachedLegacyKey: CryptoKey | null = null;
let _cachedSecureKey: CryptoKey | null = null;
let _cachedSecret: string | null = null;

function checkCacheInvalidation(secret: string) {
  if (_cachedSecret !== secret) {
    _cachedLegacyKey = null;
    _cachedSecureKey = null;
    _cachedSecret = secret;
  }
}

/**
 * Derives a Legacy CryptoKey (V1) using SHA-256 hashing (Vulnerable).
 * Kept for backward compatibility.
 */
async function getLegacyKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("ENCRYPTION_SECRET") || Deno.env.get("SHOPIFY_CLIENT_SECRET");

  if (!secret) {
    throw new Error("Security Error: Missing ENCRYPTION_SECRET or SHOPIFY_CLIENT_SECRET environment variable.");
  }

  checkCacheInvalidation(secret);
  if (_cachedLegacyKey) return _cachedLegacyKey;

  const encoder = new TextEncoder();
  const rawKey = encoder.encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", rawKey);

  _cachedLegacyKey = await crypto.subtle.importKey(
    "raw",
    hash,
    { name: ALGORITHM },
    false,
    ["decrypt"] // Legacy only needs decrypt
  );

  return _cachedLegacyKey;
}

/**
 * Derives a Secure CryptoKey (V2) using HKDF.
 * Ensures key separation and proper derivation.
 */
async function getSecureKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("ENCRYPTION_SECRET") || Deno.env.get("SHOPIFY_CLIENT_SECRET");

  if (!secret) {
    throw new Error("Security Error: Missing ENCRYPTION_SECRET or SHOPIFY_CLIENT_SECRET environment variable.");
  }

  checkCacheInvalidation(secret);
  if (_cachedSecureKey) return _cachedSecureKey;

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HKDF" },
    false,
    ["deriveKey"]
  );

  _cachedSecureKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      salt: new Uint8Array(), // Relying on high-entropy secret; adding randomness would require storage migration
      info: encoder.encode("Supabase-Encryption-V2-Key-Derivation"),
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return _cachedSecureKey;
}

/**
 * Encrypts a plaintext string using the secure V2 format.
 * Returns the encrypted string with a versioned prefix and IV.
 */
export async function encrypt(text: string | null | undefined): Promise<string | null | undefined> {
  if (!text) return text;

  try {
    const key = await getSecureKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedText = encoder.encode(text);

    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encodedText
    );

    const ivBase64 = btoa(String.fromCharCode(...iv));
    const ciphertextBase64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));

    return `${PREFIX_V2}${ivBase64}:${ciphertextBase64}`;
  } catch (error) {
    console.error("[Crypto] Encryption failed:", error);
    throw new Error("Failed to encrypt sensitive data");
  }
}

/**
 * Decrypts an encrypted string if it has the recognized prefix.
 * Supports both V1 (legacy) and V2 (secure) formats.
 * Otherwise returns the input as-is.
 */
export async function decrypt(encryptedText: string | null | undefined): Promise<string | null | undefined> {
  if (!encryptedText) {
    return encryptedText;
  }

  try {
    let key: CryptoKey;
    let prefixLength: number;

    if (encryptedText.startsWith(PREFIX_V2)) {
      key = await getSecureKey();
      prefixLength = PREFIX_V2.length;
    } else if (encryptedText.startsWith(PREFIX_V1)) {
      key = await getLegacyKey();
      prefixLength = PREFIX_V1.length;
    } else {
      // Not encrypted or unknown prefix
      return encryptedText;
    }

    const parts = encryptedText.slice(prefixLength).split(":");
    if (parts.length !== 2) {
      console.warn("[Crypto] Invalid encrypted format");
      return encryptedText;
    }

    const [ivBase64, ciphertextBase64] = parts;
    const iv = new Uint8Array(atob(ivBase64).split("").map((c) => c.charCodeAt(0)));
    const ciphertext = new Uint8Array(atob(ciphertextBase64).split("").map((c) => c.charCodeAt(0)));

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("[Crypto] Decryption failed:", error);
    // Return input to allow graceful degradation if keys are rotated incorrectly,
    // though strict security might prefer throwing.
    return encryptedText;
  }
}
