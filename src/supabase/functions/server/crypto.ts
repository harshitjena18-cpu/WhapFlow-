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

// PERFORMANCE: Hoist encoder/decoder to module level to avoid redundant object creation
const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

// Caching for V3 master key
let _cachedSecret: string | null = null;
let _cachedV3Key: CryptoKey | null = null;

function getSecret() {
  const secret = getEnv("ENCRYPTION_SECRET") || getEnv("SHOPIFY_CLIENT_SECRET");
  if (!secret) throw new Error("Security Error: Missing encryption secrets.");
  return secret;
}

/** Derives a cached master key using HKDF (V3) */
async function getV3Key(): Promise<CryptoKey> {
  const secret = getSecret();
  if (secret !== _cachedSecret) { _cachedV3Key = null; _cachedSecret = secret; }
  if (_cachedV3Key) return _cachedV3Key;

  const km = await crypto.subtle.importKey("raw", ENCODER.encode(secret), "HKDF", false, ["deriveKey"]);
  return _cachedV3Key = await crypto.subtle.deriveKey(
    { name: "HKDF", salt: ENCODER.encode("WhapFlow-V3-Salt"), info: ENCODER.encode("V3-Key"), hash: DIGEST },
    km, { name: ALGORITHM, length: KEY_LENGTH }, false, ["encrypt", "decrypt"]
  );
}

/** Derives a legacy key using PBKDF2 (V2) - Not cached as it depends on salt */
async function getV2Key(salt: Uint8Array): Promise<CryptoKey> {
  const km = await crypto.subtle.importKey("raw", ENCODER.encode(getSecret()), "PBKDF2", false, ["deriveKey"]);
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
    const ct = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, ENCODER.encode(text));

    return `${PREFIX_V3}${b64(iv)}:${b64(new Uint8Array(ct))}`;
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
      return DECODER.decode(await crypto.subtle.decrypt({ name: ALGORITHM, iv: deb64(ivB) }, await getV3Key(), deb64(ctB)));
    }
    if (enc.startsWith(PREFIX_V2)) {
      const [sB, ivB, ctB] = enc.slice(PREFIX_V2.length).split(":");
      return DECODER.decode(await crypto.subtle.decrypt({ name: ALGORITHM, iv: deb64(ivB) }, await getV2Key(deb64(sB)), deb64(ctB)));
    }
  } catch (e) {
    console.error("[Crypto] Decryption failed:", e);
  }
  return enc;
}

const b64 = (u: Uint8Array) => Buffer.from(u).toString("base64");
const deb64 = (s: string) => Buffer.from(s, "base64");
