const g = globalThis as unknown as {
  Deno?: {
    env: {
      get(key: string): string | undefined;
    };
  };
  process?: {
    env: Record<string, string | undefined>;
  };
};

/**
 * PERFORMANCE: Use a pre-determined environment getter to avoid redundant
 * runtime checks (Deno vs Node) on every getEnv call.
 */
const envGetter = g.Deno?.env?.get
  ? (key: string) => g.Deno!.env.get(key)
  : g.process?.env
    ? (key: string) => g.process!.env[key]
    : (_key: string) => undefined;

export const getEnv = (key: string): string | undefined => {
  return envGetter(key);
};
