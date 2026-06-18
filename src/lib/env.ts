export const getEnv = (key: string): string | undefined => {
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

  // PERFORMANCE: Optimized lookup to reduce branch overhead while maintaining environment priority.
  return g.Deno?.env?.get ? g.Deno.env.get(key) : g.process?.env?.[key];
};
