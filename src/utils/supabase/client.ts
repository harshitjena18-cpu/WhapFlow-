import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Add a global declaration to avoid TypeScript errors
declare global {
  interface Window {
    __supabaseClient?: SupabaseClient;
  }
}

function getSupabaseClient() {
  if (typeof window !== 'undefined') {
    if (!window.__supabaseClient) {
      window.__supabaseClient = createClient(
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
    return window.__supabaseClient;
  }
  
  // Fallback for non-browser environments
  return createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  );
}

export const supabase = getSupabaseClient();
