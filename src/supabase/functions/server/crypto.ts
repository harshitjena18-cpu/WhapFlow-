/**
 * Crypto utility for encrypting and decrypting sensitive data at rest.
 * Uses AES-GCM with a key derived from environment secrets.
 */

const ALGORITHM = "AES-GCM";
const PREFIX = "enc:v1:";

/**
 * Derives a CryptoKey from the environment secret.
 * Falls back to SHOPIFY_CLIENT_SECRET if ENCRYPTION_SECRET is not provided.
 */
async function getKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("ENCRYPTION_SECRET") || Deno.env.get("SHOPIFY_CLIENT_SECRET");
  if (!secret) {
    throw new Error("Security Error: Missing ENCRYPTION_SECRET or SHOPIFY_CLIENT_SECRET environment variable.");
  }

  const encoder = new TextEncoder();
  const rawKey = encoder.encode(secret);
  // Hash the secret to ensure it's 256 bits
  const hash = await crypto.subtle.digest("SHA-256", rawKey);

  return await crypto.subtle.importKey(
    "raw",
    hash,
    { name: ALGORITHM },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a plaintext string.
 * Returns the encrypted string with a versioned prefix and IV.
 */
export async function encrypt(text: string | null | undefined): Promise<string | null | undefined> {
  if (!text) return text;

  try {
    const key = await getKey();
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

    return `${PREFIX}${ivBase64}:${ciphertextBase64}`;
  } catch (error) {
    console.error("[Crypto] Encryption failed:", error);
    throw new Error("Failed to encrypt sensitive data");
  }
}

/**
 * Decrypts an encrypted string if it has the recognized prefix.
 * Otherwise returns the input as-is (for backward compatibility).
 */
export async function decrypt(encryptedText: string | null | undefined): Promise<string | null | undefined> {
  if (!encryptedText || !encryptedText.startsWith(PREFIX)) {
    return encryptedText;
  }

  try {
    const key = await getKey();
    const parts = encryptedText.slice(PREFIX.length).split(":");
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
    // In case of decryption failure, we return the input to avoid breaking
    // functionality if the key changed, though this is a security trade-off.
    return encryptedText;
  }
}
