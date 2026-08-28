// Baixa todos os eventos do seu Supabase para um arquivo JSON local.
//
//   npm run backup            -> grava em ./backups/events-<data>.json
//   npm run backup -- ../meu  -> grava em ../meu/events-<data>.json
//
// Lê as credenciais do .env.local (nunca as escreva aqui dentro).
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const envPath = '.env.local';
if (!fs.existsSync(envPath)) {
  console.error('Não encontrei .env.local — copie o .env.example e preencha antes de rodar.');
  process.exit(1);
}

const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter(l => l.trim() && !l.trim().startsWith('#') && l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key, VITE_SUPABASE_FAMILY_ID: family } = env;
if (!url || !key) {
  console.error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam estar preenchidos no .env.local.');
  process.exit(1);
}

const sb = createClient(url, key);
const rows = [];

// A API pagina em 1000 linhas por requisição
for (let from = 0; ; from += 1000) {
  let q = sb.from('events').select('*').order('device_ts', { ascending: true }).range(from, from + 999);
  if (family) q = q.eq('family_id', family);
  const { data, error } = await q;
  if (error) {
    console.error('Falha ao ler os eventos:', error.message);
    process.exit(1);
  }
  rows.push(...data);
  if (data.length < 1000) break;
}

const dir = process.argv[2] || 'backups';
fs.mkdirSync(dir, { recursive: true });
const out = path.join(dir, `events-${new Date().toISOString().slice(0, 10)}.json`);
fs.writeFileSync(out, JSON.stringify(rows, null, 2));

const snaps = rows.filter(e => e.event_type === 'SNAPSHOT_MONTHLY').length;
console.log(`✓ ${rows.length} eventos (${snaps} snapshots mensais) salvos em ${out}`);
