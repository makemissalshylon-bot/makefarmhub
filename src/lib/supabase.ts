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
    // Simple test: try to reach the database
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = "no rows returned" which is fine
      console.warn('Supabase connection test failed:', error.message);
      _supabaseReady = false;
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
