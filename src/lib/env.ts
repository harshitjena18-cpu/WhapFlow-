// PERFORMANCE: Module-level cache for environment detection to avoid redundant property lookups on every call.
// This yields a measurable speedup in hot paths like middleware and KV initialization.
let _envCache: 'deno' | 'node' | 'unknown' | null = null;

export const getEnv = (key: string): string | undefined => {
  const g = globalThis as any;

  if (_envCache === null) {
    if (g.Deno?.env?.get) {
      _envCache = 'deno';
    } else if (g.process?.env) {
      _envCache = 'node';
    } else {
      _envCache = 'unknown';
    }
  }

  if (_envCache === 'deno') {
    return g.Deno.env.get(key);
  }

  if (_envCache === 'node') {
    return g.process.env[key];
  }

  return undefined;
};
