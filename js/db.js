// Bantuan kecil untuk menyimpan data lewat API PHP. Satu tabel = satu file di folder api/
// (misalnya patients → api/patients.php). Server hanya membuka data milik akun yang sedang login.
import { api } from './api.js';

export { api };

export const insertRow = (table, row) => api(`${table}.php`, { method: 'POST', body: row });

export const updateRow = (table, id, changes) =>
  api(`${table}.php`, { method: 'PATCH', params: { id }, body: changes });

export const deleteRow = (table, id) => api(`${table}.php`, { method: 'DELETE', params: { id } });
