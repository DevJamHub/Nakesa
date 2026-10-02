// Pastikan setiap src/href lokal di HTML dan setiap import relatif di JS menunjuk ke file yang ada.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const walk = (d) => readdirSync(d).flatMap((n) => {
  if (n.startsWith('.') || n === 'node_modules') return [];
  const p = join(d, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

const isLocal = (u) => u && !/^(https?:|\/\/|#|mailto:|tel:|data:|javascript:|\$\{)/.test(u);
const missing = [];
for (const file of walk('.')) {
  let refs = [];
  const src = readFileSync(file, 'utf8');
  if (file.endsWith('.html')) refs = [...src.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]);
  else if (file.endsWith('.js')) refs = [...src.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)["'](\.{1,2}\/[^"']+)["']/g)].map((m) => m[1]);
  for (const ref of refs.filter(isLocal)) {
    const clean = ref.split(/[?#]/)[0];
    if (!clean) continue;
    const target = clean.startsWith('/') ? resolve('.' + clean) : resolve(dirname(file), clean);
    if (!existsSync(target)) missing.push(`${file}: ${ref}`);
  }
}
if (missing.length) {
  console.error('Referensi file tidak ditemukan:\n' + missing.join('\n'));
  process.exit(1);
}
console.log('Semua referensi file lokal valid.');
