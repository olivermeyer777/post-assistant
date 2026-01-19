
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to safely access environment variables in different environments (Vite, Node, etc.)
const getEnv = (key: string) => {
  // 1. Try import.meta.env (Vite standard)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  // 2. Try process.env (Node/Webpack standard)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore reference errors if process is not defined
  }
  return '';
};

// Default credentials provided
const DEFAULT_SUPABASE_URL = 'https://nqjeojgjcsdkqiwqqmsq.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_76OGPtauF5s4Z4xgCWmQ1w_J8qw6xCA';

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || DEFAULT_SUPABASE_KEY;

let client: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  client = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn("⚠️ Supabase URL or Anon Key missing. App running in offline mode. Please check your .env file.");
  
  // Mock Response
  const mockResponse = Promise.resolve({ 
      data: null, 
      error: { message: "Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env", code: "MISSING_CONFIG" } 
  });

  // Recursive Mock Builder to handle chained calls like .from().select().eq()...
  const mockBuilder: any = new Proxy({}, {
      get: (_target, prop) => {
          if (prop === 'then') {
              return (resolve: any, reject: any) => mockResponse.then(resolve, reject);
          }
          // Return self for chaining
          return () => mockBuilder;
      }
  });

  // Mock Client
  client = {
      from: () => mockBuilder,
      // Add other root methods if needed
  } as unknown as SupabaseClient;
}

export const supabase = client;
