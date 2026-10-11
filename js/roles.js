// The signed-in user's role in the practice: 'admin' (owner), 'nakes' (bidan / health
// worker) or 'staf' (non-clinical). The database enforces the same rules with RLS;
// the pages use these only to hide buttons the user cannot use anyway.
import { run, supabase } from './db.js';

export async function practiceRole(practice, user) {
  try {
    const row = await run(supabase.from('practice_members').select('role')
      .eq('practice_id', practice.id).eq('user_id', user.id).maybeSingle());
    if (row) return row.role;
  } catch { /* fall back below */ }
  return practice.owner_id === user.id ? 'admin' : 'staf';
}

export const ROLE_LABEL = { admin: 'Admin (pemilik praktik)', nakes: 'Tenaga kesehatan', staf: 'Staf' };

/** Add, edit and take stock of medicines; write prescriptions. */
export const canManage = (role) => role === 'admin' || role === 'nakes';

/** Approve a medicine for prescriptions/services, delete medicines, change settings. */
export const isAdmin = (role) => role === 'admin';
