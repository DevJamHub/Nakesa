// Small helpers around Supabase database calls. Row Level Security makes sure
// every query only touches the signed-in user's own rows.
import { supabase } from './supabase.js';

export { supabase };

/** Await a Supabase query and return its data, throwing on error. */
export async function run(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export const insertRow = (table, row) => run(supabase.from(table).insert(row).select().single());

export const updateRow = (table, id, changes) =>
  run(supabase.from(table).update(changes).eq('id', id).select().single());

export const deleteRow = (table, id) => run(supabase.from(table).delete().eq('id', id));

/** Number of rows in a table (for the signed-in user); `where` can add filters to the query. */
export async function countRows(table, where = (query) => query) {
  const { count, error } = await where(supabase.from(table).select('id', { count: 'exact', head: true }));
  if (error) throw error;
  return count ?? 0;
}
