import { api } from './api.js';

/** Get the signed-in user's profile: { id, full_name, email, avatar_url, profession, created_at }. */
export async function fetchProfile() {
  return api('profile.php');
}

/** changes: { full_name?, profession? } — the only columns users may edit. */
export async function updateProfile(userId, changes) {
  return api('profile.php', { method: 'PATCH', body: changes });
}
