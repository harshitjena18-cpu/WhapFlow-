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

  if (g.Deno?.env?.get) {
    return g.Deno.env.get(key);
  }

  if (g.process?.env) {
    return g.process.env[key];
  }

  return undefined;
};
