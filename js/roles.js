// The signed-in user's role in the practice: 'admin' (owner), 'nakes' (bidan / health
// worker) or 'staf' (non-clinical). Every account owns exactly one practice, so the
// signed-in user is always its admin. Pages use these only to hide buttons.
export async function practiceRole() {
  return 'admin';
}

export const ROLE_LABEL = { admin: 'Admin (pemilik praktik)', nakes: 'Tenaga kesehatan', staf: 'Staf' };

/** Add, edit and take stock of medicines; write prescriptions. */
export const canManage = (role) => role === 'admin' || role === 'nakes';

/** Approve a medicine for prescriptions/services, delete medicines, change settings. */
export const isAdmin = (role) => role === 'admin';
