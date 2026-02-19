import app from "../src/supabase/functions/server/index.tsx";

console.log("Registered Routes:");
app.routes.forEach(route => {
  console.log(`${route.method} ${route.path}`);
});
