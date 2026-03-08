/**
 * Crypto utility for encrypting and decrypting sensitive data at rest.
 * V3 (Latest): HKDF + AES-GCM (Preferred for performance and security)
 * V2 (Legacy): PBKDF2 + AES-GCM
 */
import { getEnv } from "../../../lib/env.ts";
import { Buffer } from "node:buffer";

const ALGORITHM = "AES-GCM";
const PREFIX_V3 = "enc:v3:";
const PREFIX_V2 = "enc:v2:";
const IV_LENGTH = 12;
const ITERATIONS_V2 = 100000;
const KEY_LENGTH = 256;
const DIGEST = "SHA-256";

// PERFORMANCE: Hoist encoders to module level to avoid redundant allocations
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// PERFORMANCE: Pre-encode static HKDF parameters to avoid TextEncoder overhead in hot path
const V3_SALT = encoder.encode("WhapFlow-V3-Salt");
const V3_INFO = encoder.encode("V3-Key");

// Caching for V3 master key
let _cachedSecret: string | null = null;
let _cachedV3Key: CryptoKey | null = null;
// PERFORMANCE: Promise-based cache to prevent "thundering herd" on concurrent cold starts
let _v3KeyPromise: Promise<CryptoKey> | null = null;

function getSecret() {
  const secret = getEnv("ENCRYPTION_SECRET") || getEnv("SHOPIFY_CLIENT_SECRET");
  if (!secret) throw new Error("Security Error: Missing encryption secrets.");
  return secret;
}

/**
 * Derives a cached master key using HKDF (V3)
 * PERFORMANCE: Uses a promise-based cache to handle concurrent requests during key derivation.
 */
function getV3Key(): Promise<CryptoKey> {
  const secret = getSecret();

  // Invalidate cache if secret changed
  if (secret !== _cachedSecret) {
    _cachedV3Key = null;
    _v3KeyPromise = null;
    _cachedSecret = secret;
  }

  if (_cachedV3Key) return Promise.resolve(_cachedV3Key);
  if (_v3KeyPromise) return _v3KeyPromise;

  _v3KeyPromise = (async () => {
    try {
      const km = await crypto.subtle.importKey("raw", encoder.encode(secret), "HKDF", false, ["deriveKey"]);
      const key = await crypto.subtle.deriveKey(
        { name: "HKDF", salt: V3_SALT, info: V3_INFO, hash: DIGEST },
        km, { name: ALGORITHM, length: KEY_LENGTH }, false, ["encrypt", "decrypt"]
      );
      _cachedV3Key = key;
      return key;
    } finally {
      _v3KeyPromise = null;
    }
  })();

  return _v3KeyPromise;
}

/** Derives a legacy key using PBKDF2 (V2) - Not cached as it depends on salt */
async function getV2Key(salt: Uint8Array): Promise<CryptoKey> {
  const km = await crypto.subtle.importKey("raw", encoder.encode(getSecret()), "PBKDF2", false, ["deriveKey"]);
  return await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS_V2, hash: DIGEST },
    km, { name: ALGORITHM, length: KEY_LENGTH }, false, ["encrypt", "decrypt"]
  );
}

export async function encrypt(text: string | null | undefined): Promise<string | null | undefined> {
  if (!text) return text;
  try {
    const key = await getV3Key();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const ct = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, encoder.encode(text));

    // PERFORMANCE: Pass ArrayBuffer directly to b64 to avoid redundant Uint8Array wrap
    return `${PREFIX_V3}${b64(iv)}:${b64(ct)}`;
  } catch (e) {
    console.error("[Crypto] Encryption failed:", e);
    throw new Error("Failed to encrypt data");
  }
}

export async function decrypt(enc: string | null | undefined): Promise<string | null | undefined> {
  if (!enc) return enc;
  try {
    if (enc.startsWith(PREFIX_V3)) {
      const [ivB, ctB] = enc.slice(PREFIX_V3.length).split(":");
      return decoder.decode(await crypto.subtle.decrypt({ name: ALGORITHM, iv: deb64(ivB) }, await getV3Key(), deb64(ctB)));
    }
    if (enc.startsWith(PREFIX_V2)) {
      const [sB, ivB, ctB] = enc.slice(PREFIX_V2.length).split(":");
      return decoder.decode(await crypto.subtle.decrypt({ name: ALGORITHM, iv: deb64(ivB) }, await getV2Key(deb64(sB)), deb64(ctB)));
    }
  } catch (e) {
    console.error("[Crypto] Decryption failed:", e);
  }
  return enc;
}

/**
 * PERFORMANCE: Refactored to accept ArrayBuffer | Uint8Array to reduce overhead in hot paths
 */
const b64 = (u: ArrayBuffer | Uint8Array) => Buffer.from(u).toString("base64");
const deb64 = (s: string) => Buffer.from(s, "base64");
