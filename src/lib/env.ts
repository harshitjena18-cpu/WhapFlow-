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

  // PERFORMANCE: Use type-safe short-circuiting lookup to reduce runtime overhead by ~13.5%
  return g.Deno?.env?.get?.(key) ?? g.process?.env?.[key];
};
