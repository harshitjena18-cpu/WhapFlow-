/**
 * Crypto utility for encrypting and decrypting sensitive data at rest.
 * Uses AES-GCM with a key derived from environment secrets using PBKDF2.
 */

const ALGORITHM = "AES-GCM";
const PREFIX = "enc:v2:";
const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 256;
const DIGEST = "SHA-256";

function checkCacheInvalidation(secret: string) {
  if (_cachedSecret !== secret) {
    _cachedLegacyKey = null;
    _cachedSecureKey = null;
    _cachedSecret = secret;
  }
}

/**
 * Derives a CryptoKey from the environment secret using PBKDF2 with a random salt.
 * Falls back to SHOPIFY_CLIENT_SECRET if ENCRYPTION_SECRET is not provided.
 */
async function getKey(salt: Uint8Array): Promise<CryptoKey> {
  const secret = Deno.env.get("ENCRYPTION_SECRET") || Deno.env.get("SHOPIFY_CLIENT_SECRET");

  if (!secret) {
    throw new Error("Security Error: Missing ENCRYPTION_SECRET or SHOPIFY_CLIENT_SECRET environment variable.");
  }

  checkCacheInvalidation(secret);
  if (_cachedLegacyKey) return _cachedLegacyKey;

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: ITERATIONS,
      hash: DIGEST,
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a plaintext string.
 * Returns the encrypted string with a versioned prefix, salt, and IV.
 * Format: enc:v2:<salt_base64>:<iv_base64>:<ciphertext_base64>
 */
export async function encrypt(text: string | null | undefined): Promise<string | null | undefined> {
  if (!text) return text;

  try {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const key = await getKey(salt);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedText = encoder.encode(text);

    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encodedText
    );

    // Convert to base64
    const saltBase64 = btoa(String.fromCharCode(...salt));
    const ivBase64 = btoa(String.fromCharCode(...iv));
    const ciphertextBase64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));

    return `${PREFIX}${saltBase64}:${ivBase64}:${ciphertextBase64}`;
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
    const parts = encryptedText.slice(PREFIX.length).split(":");
    if (parts.length !== 3) {
      console.warn("[Crypto] Invalid encrypted format");
      return encryptedText;
    }

    const [saltBase64, ivBase64, ciphertextBase64] = parts;
    const salt = new Uint8Array(atob(saltBase64).split("").map((c) => c.charCodeAt(0)));
    const iv = new Uint8Array(atob(ivBase64).split("").map((c) => c.charCodeAt(0)));
    const ciphertext = new Uint8Array(atob(ciphertextBase64).split("").map((c) => c.charCodeAt(0)));

    const key = await getKey(salt);

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
