// PERFORMANCE: Module-level cache for environment detection to avoid redundant lookups on every getEnv call.
const g = globalThis as any;
const isDeno = !!g.Deno?.env?.get;
const isNode = !!g.process?.env;

export const getEnv = (key: string): string | undefined => {
  if (isDeno) {
    return g.Deno.env.get(key);
  }

  if (isNode) {
    return g.process.env[key];
  }

  return undefined;
};
