import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Add a global declaration to avoid TypeScript errors
declare global {
  // deno-lint-ignore no-var
  var __supabaseClient: SupabaseClient | undefined;
}

function getSupabaseClient() {
  if (typeof globalThis !== 'undefined') {
    if (!globalThis.__supabaseClient) {
      globalThis.__supabaseClient = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );
    }
    return globalThis.__supabaseClient;
  }
  
  // Fallback for non-browser environments
  return createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  );
}

export const supabase = getSupabaseClient();
