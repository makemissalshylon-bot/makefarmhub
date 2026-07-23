import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Track whether Supabase is actually working
let _supabaseReady = false;
let _supabaseChecked = false;

// Check if credentials look valid (not placeholder, not empty)
const hasValidCredentials = () => {
  return (
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder') &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey.length > 20
  );
};

// Create client safely
let _supabase: SupabaseClient;
try {
  _supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
  );
} catch (err) {
  console.warn('Failed to create Supabase client:', err);
  _supabase = createClient(
    'https://placeholder.supabase.co',
    'placeholder-key'
  );
}

export const supabase = _supabase;

// Test Supabase connection (call once at app start)
export async function testSupabaseConnection(): Promise<boolean> {
  if (_supabaseChecked) return _supabaseReady;
  _supabaseChecked = true;

  if (!hasValidCredentials()) {
    console.warn('Supabase credentials not configured - using mock data mode');
    _supabaseReady = false;
    return false;
  }

  try {
    // Prefer a public catalog table — profiles may be RLS-blocked for anon.
    const { error } = await supabase.from('listings').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // Credentials work if we get a real PostgREST response (including empty/RLS).
      // Only treat network/invalid-key failures as offline.
      const msg = (error.message || '').toLowerCase();
      const badKey =
        msg.includes('invalid api key') ||
        msg.includes('jwt') ||
        msg.includes('apikey') ||
        error.code === 'PGRST301';
      if (badKey) {
        console.warn('Supabase connection test failed:', error.message);
        _supabaseReady = false;
      } else {
        // Table missing / RLS / empty — project is reachable
        _supabaseReady = true;
      }
    } else {
      _supabaseReady = true;
    }
  } catch (err) {
    console.warn('Supabase unreachable:', err);
    _supabaseReady = false;
  }

  return _supabaseReady;
}

export function isSupabaseReady(): boolean {
  return _supabaseReady;
}

export default supabase;
