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

  // PERFORMANCE: Use short-circuiting lookups to reduce runtime overhead across the entire app
  return g.Deno?.env?.get?.(key) ?? g.process?.env?.[key];
};
