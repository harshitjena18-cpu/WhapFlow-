/**
 * Optimized environment variable accessor.
 * Uses short-circuiting lookups to minimize branching overhead.
 */
const g = globalThis as any;

export const getEnv = (key: string): string | undefined => {
  // PERFORMANCE: Direct lookup with optional chaining is faster than explicit if/else blocks
  // while still allowing for environment changes (important for test isolation).
  return g.Deno?.env?.get?.(key) ?? g.process?.env?.[key];
};
