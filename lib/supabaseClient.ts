
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to safely access environment variables in different environments (Vite, Node, etc.)
const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore reference errors
  }
  return '';
};

// Default credentials provided
const DEFAULT_SUPABASE_URL = 'https://nqjeojgjcsdkqiwqqmsq.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_76OGPtauF5s4Z4xgCWmQ1w_J8qw6xCA';

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || DEFAULT_SUPABASE_KEY;

let client: SupabaseClient;

// Simple validation to check if keys look real (not empty/undefined strings)
const isValidKey = (key: string) => key && key.length > 10;

if (supabaseUrl && isValidKey(supabaseAnonKey)) {
  client = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn("⚠️ Supabase URL or Anon Key missing or invalid. App running in offline mode.");
  
  // Robust Mock Response Builder
  const mockResponse = Promise.resolve({ 
      data: null, 
      error: { message: "Supabase not configured (Offline Mode).", code: "MISSING_CONFIG" } 
  });

  // Mock for Channel/Realtime Subscription
  const mockChannel = {
      on: () => mockChannel,
      subscribe: () => mockChannel,
      unsubscribe: () => Promise.resolve(),
      send: () => Promise.resolve(),
  };

  const mockBuilder: any = new Proxy({}, {
      get: (_target, prop) => {
          if (prop === 'then') {
              return (resolve: any, reject: any) => mockResponse.then(resolve, reject);
          }
          if (prop === 'select' || prop === 'insert' || prop === 'update' || prop === 'delete' || prop === 'eq' || prop === 'single') {
              return () => mockBuilder;
          }
          return () => mockBuilder;
      }
  });

  // Complete Mock Client
  client = {
      from: () => mockBuilder,
      channel: () => mockChannel,
      removeChannel: () => Promise.resolve(),
      removeAllChannels: () => Promise.resolve(),
      // Add other necessary root methods as no-ops
      auth: {
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      }
  } as unknown as SupabaseClient;
}

export const supabase = client;
