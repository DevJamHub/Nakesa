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

/**
 * Every row of a query. The Supabase API returns at most 1000 rows per request, so read
 * page by page. `makeQuery` builds a fresh query with a stable order, e.g.
 * fetchAll(() => supabase.from('transactions').select('amount').order('id'))
 */
export async function fetchAll(makeQuery, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const page = await run(makeQuery().range(from, from + pageSize - 1));
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

export const insertRow = (table, row) => run(supabase.from(table).insert(row).select().single());

export const updateRow = (table, id, changes) =>
  run(supabase.from(table).update(changes).eq('id', id).select().single());

export const deleteRow = (table, id) => run(supabase.from(table).delete().eq('id', id));

/** Number of rows in a table (for the signed-in user). */
export async function countRows(table) {
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}
