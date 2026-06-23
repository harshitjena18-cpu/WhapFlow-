export const getEnv = (key: string): string | undefined => {
  const g = globalThis as { Deno?: { env: { get: (k: string) => string | undefined } }; process?: { env: Record<string, string | undefined> } };
  return g.Deno?.env?.get?.(key) ?? g.process?.env?.[key];
};
