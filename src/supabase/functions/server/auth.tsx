import { getEnv } from "../../../lib/env.ts";
import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js@2";
import { secureCompare } from "./crypto.ts";

const authApp = new Hono();

authApp.post("/signup", async (c) => {
  // SECURITY: Protect admin signup from unauthorized use
  // This endpoint uses the service role key to create users, so it MUST be protected.
  const authHeader = c.req.header("Authorization");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  const providedToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (!serviceKey || !providedToken || !secureCompare(providedToken, serviceKey)) {
    console.error("[Auth] Unauthorized attempt to call /signup");
    return c.json({ error: "Unauthorized: Invalid or missing token" }, 401);
  }

  const { email, password, user_metadata } = await c.req.json();

  const supabaseUrl = getEnv("SUPABASE_URL");
  const supabaseServiceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return c.json({ error: "Server configuration error: Missing Supabase credentials" }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata,
    email_confirm: true,
  });

  if (error) {
    return c.json({ error: error.message }, 400);
  }

  return c.json({ data });
});

export default authApp;
