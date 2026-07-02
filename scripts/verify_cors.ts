import { assert } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import app from "../src/supabase/functions/server/index.tsx";

Deno.test("CORS Middleware - Production Domain", async () => {
  const res = await app.request("/make-server-c8eef56a/health", {
    headers: { "Origin": "https://app.whapflow.com" }
  });

  assert(res.headers.get("access-control-allow-origin") === "https://app.whapflow.com", "Should allow APP_DOMAIN");
});

Deno.test("CORS Middleware - API Domain", async () => {
  const res = await app.request("/make-server-c8eef56a/health", {
    headers: { "Origin": "https://api.whapflow.com" }
  });

  assert(res.headers.get("access-control-allow-origin") === "https://api.whapflow.com", "Should allow API_DOMAIN");
});

Deno.test("CORS Middleware - Localhost", async () => {
  const res = await app.request("/make-server-c8eef56a/health", {
    headers: { "Origin": "http://localhost:3000" }
  });

  assert(res.headers.get("access-control-allow-origin") === "http://localhost:3000", "Should allow localhost");
});

Deno.test("CORS Middleware - Unauthorized Domain", async () => {
  const res = await app.request("/make-server-c8eef56a/health", {
    headers: { "Origin": "https://evil.com" }
  });

  assert(res.headers.get("access-control-allow-origin") === null, "Should block evil.com");
});

Deno.test("CORS Middleware - No Origin", async () => {
  const res = await app.request("/make-server-c8eef56a/health");
  assert(res.headers.get("access-control-allow-origin") === null, "Should not return CORS headers for no-origin requests");
});
