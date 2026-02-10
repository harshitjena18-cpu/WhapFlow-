import { getEnv } from "../../../lib/env.ts";
import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js@2";

const authApp = new Hono();

authApp.post("/signup", async (c) => {
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
