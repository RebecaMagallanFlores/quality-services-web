// Verifica dist/: enlaces internos, recursos, atributos alt, idioma y metadatos básicos.
// Uso: node scripts/check.mjs   (después de compilar; respeta BASE_PATH)
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
let BASE = (process.env.BASE_PATH ?? '/').trim();
if (!BASE.startsWith('/')) BASE = '/' + BASE;
if (!BASE.endsWith('/')) BASE += '/';

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const html = walk(dist).filter((f) => f.endsWith('.html'));
const problems = [];
let refs = 0;

for (const file of html) {
  const rel = file.slice(dist.length);
  const src = readFileSync(file, 'utf8');
  if (!/<html lang="(en|es)"/.test(src)) problems.push(`${rel}: falta lang en <html>`);
  if (!/<title>[^<]+<\/title>/.test(src)) problems.push(`${rel}: falta <title>`);
  if (!/<meta name="description" content="[^"]+"/.test(src)) problems.push(`${rel}: falta meta description`);
  for (const m of src.matchAll(/<img\b[^>]*>/g)) if (!/\balt="/.test(m[0])) problems.push(`${rel}: <img> sin alt`);
  const ids = new Set([...src.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  const dup = [...src.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]).filter((v, i, a) => a.indexOf(v) !== i);
  if (dup.length) problems.push(`${rel}: ids duplicados ${[...new Set(dup)].join(', ')}`);
  for (const m of src.matchAll(/(?:href|src)="([^"]+)"|srcset="([^"]+)"/g)) {
    const urls = m[1] ? [m[1]] : m[2].split(',').map((s) => s.trim().split(/\s+/)[0]);
    for (let u of urls) {
      if (/^(https?:|mailto:|tel:|data:)/.test(u)) continue;
      refs++;
      if (u.startsWith('#')) { if (u.length > 1 && !ids.has(u.slice(1))) problems.push(`${rel}: ancla rota ${u}`); continue; }
      if (!u.startsWith(BASE)) { problems.push(`${rel}: ruta fuera de BASE_PATH ${u}`); continue; }
      let p = decodeURI(u.slice(BASE.length).split(/[?#]/)[0]);
      let target = join(dist, p);
      if (p === '' || p.endsWith('/')) target = join(target, 'index.html');
      if (!existsSync(target)) problems.push(`${rel}: enlace roto ${u}`);
    }
  }
}
console.log(`Revisados ${html.length} HTML y ${refs} referencias internas (BASE_PATH=${BASE}).`);
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('✓ Sin enlaces rotos ni problemas detectados.');
