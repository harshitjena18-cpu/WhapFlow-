
import { webcrypto } from 'node:crypto';

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const DIGEST = "SHA-256";
const ENCODER = new TextEncoder();

// --- Simplified Crypto Logic for Benchmarking Singleflight ---

let _cachedSecret: string | null = null;
let _cachedV3Key: CryptoKey | null = null;
let _v3KeyPromise: Promise<CryptoKey> | null = null;
let derivationCount = 0;

async function getV3Key(): Promise<CryptoKey> {
  const secret = "test-secret";
  if (secret !== _cachedSecret) {
    _cachedV3Key = null;
    _cachedSecret = secret;
    _v3KeyPromise = null;
  }

  if (_cachedV3Key) return _cachedV3Key;
  if (_v3KeyPromise) return _v3KeyPromise;

  _v3KeyPromise = (async () => {
    derivationCount++;
    const km = await webcrypto.subtle.importKey("raw", ENCODER.encode(secret), "HKDF", false, ["deriveKey"]);
    const key = await webcrypto.subtle.deriveKey(
      {
        name: "HKDF",
        salt: ENCODER.encode("WhapFlow-V3-Salt"),
        info: ENCODER.encode("V3-Key"),
        hash: DIGEST
      },
      km, { name: ALGORITHM, length: KEY_LENGTH }, false, ["encrypt", "decrypt"]
    );
    _cachedV3Key = key;
    return key;
  })();

  return _v3KeyPromise;
}

// --- Benchmark ---

async function benchmark(name: string, fn: () => Promise<any>, concurrency: number = 100) {
    console.log(`\n--- Benchmarking ${name} (${concurrency} concurrent calls) ---`);
    derivationCount = 0;
    const start = performance.now();
    await Promise.all(Array.from({ length: concurrency }).map(() => fn()));
    const end = performance.now();
    console.log(`Total time: ${(end - start).toFixed(2)}ms`);
    console.log(`Derivation/Import count: ${derivationCount}`);

    if (derivationCount !== 1) {
        console.error(`❌ FAILED: Expected 1 derivation, but got ${derivationCount}`);
        process.exit(1);
    } else {
        console.log("✅ PASSED: Singleflight pattern confirmed.");
    }
}

async function run() {
    await benchmark("Crypto V3 Derivation (Singleflight)", () => getV3Key(), 100);
}

run().catch(console.error);
