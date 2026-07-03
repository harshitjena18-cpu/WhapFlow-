/**
 * src/lib/env.ts
 *
 * Optimized environment variable retrieval with platform detection caching.
 */

// PERFORMANCE: Module-level cache for platform detection to avoid repeated globalThis lookups.
// This provides a slight but measurable speedup in hot paths like session verification.
let _envType: 'deno' | 'node' | 'unknown' | null = null;

export const getEnv = (key: string): string | undefined => {
  if (!_envType) {
    const g = globalThis as unknown as {
      Deno?: { env: { get(key: string): string | undefined } };
      process?: { env: Record<string, string | undefined> };
    };

    if (g.Deno?.env?.get) {
      _envType = 'deno';
    } else if (g.process?.env) {
      _envType = 'node';
    } else {
      _envType = 'unknown';
    }
  }

  if (_envType === 'deno') {
    return (globalThis as any).Deno.env.get(key);
  }

  if (_envType === 'node') {
    return (globalThis as any).process.env[key];
  }

  return undefined;
};
