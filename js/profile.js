import { supabase } from './supabase.js';

const COLUMNS = 'id, full_name, email, avatar_url, profession, created_at';

/**
 * Get the signed-in user's profile. The row is created by a database trigger
 * at sign-up, so retry briefly in case we arrive before it exists.
 */
export async function fetchProfile(userId, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    const { data, error } = await supabase.from('profiles').select(COLUMNS).eq('id', userId).maybeSingle();
    if (error) throw error;
    if (data) return data;
    await new Promise((r) => setTimeout(r, 300 * (i + 1)));
  }
  return null;
}

/** changes: { full_name?, profession? } — the only columns users may edit. */
export async function updateProfile(userId, changes) {
  const { data, error } = await supabase
    .from('profiles')
    .update(changes)
    .eq('id', userId)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data;
}
