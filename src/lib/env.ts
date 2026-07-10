// PERFORMANCE: Pre-detect environment to avoid redundant property lookups on globalThis.
const isDeno = typeof (globalThis as any).Deno !== "undefined";
const isNode = typeof (globalThis as any).process !== "undefined";

export const getEnv = (key: string): string | undefined => {
  if (isDeno) {
    return (globalThis as any).Deno.env.get(key);
  }

  if (isNode) {
    return (globalThis as any).process.env[key];
  }

  return undefined;
};
