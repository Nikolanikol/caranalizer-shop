// Заливка авто и связей part_vehicles в Supabase.
// Требует созданных таблиц (scripts/create-vehicles-tables.sql).
//   node scripts/upload-vehicles.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLines = fs.readFileSync('.env', 'utf8').split('\n');
for (const l of envLines) { const m = l.match(/^([^#=]+)=(.*)$/); if (m) process.env[m[1].trim()] = m[2].trim(); }

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const vehicles = JSON.parse(fs.readFileSync('data/vehicles-final.json', 'utf8'));
const rawToKey = JSON.parse(fs.readFileSync('data/raw-to-vehicle.json', 'utf8'));

// --- слаги ---
function slugify(v) {
  let base = `${v.brand}-${v.name_en}`.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const yf = v.year_from ? String(v.year_from).split('.')[0] : '';
  const yt = v.year_to ? String(v.year_to).split('.')[0] : (v.open_ended ? 'now' : '');
  if (yf || yt) base += `-${yf}${yt ? '-' + yt : ''}`;
  return base;
}
const seenSlugs = new Map();
for (const v of vehicles) {
  let slug = slugify(v);
  const n = seenSlugs.get(slug) || 0;
  seenSlugs.set(slug, n + 1);
  if (n > 0) slug = `${slug}-${n + 1}`;
  v.slug = slug;
}

// --- 1. вставка vehicles ---
console.log(`Заливаю ${vehicles.length} авто...`);
const payload = vehicles.map(v => ({
  key: v.key, brand: v.brand, model_ko: v.model_ko, name_en: v.name_en,
  gen_code: v.gen_code || null, year_from: v.year_from || null, year_to: v.year_to || null,
  open_ended: !!v.open_ended, slug: v.slug,
}));

for (let i = 0; i < payload.length; i += 500) {
  const { error } = await s.from('vehicles').upsert(payload.slice(i, i + 500), { onConflict: 'key' });
  if (error) { console.error('vehicles upsert:', error.message); process.exit(1); }
}
console.log('Авто залиты.');

// --- получаем id ---
const keyToId = new Map();
let off = 0;
while (true) {
  const { data, error } = await s.from('vehicles').select('id,key').range(off, off + 999);
  if (error) { console.error(error.message); process.exit(1); }
  if (!data || !data.length) break;
  for (const r of data) keyToId.set(r.key, r.id);
  off += 1000;
}
console.log(`Получено id: ${keyToId.size}`);

// --- 2. связи из partsro-images.jsonl ---
const lines = fs.readFileSync('data/partsro-images.jsonl', 'utf8').trim().split('\n');
const pairs = new Set(); // "part|vehicle"
for (const l of lines) {
  try {
    const r = JSON.parse(l);
    if (r.status !== 'ok' || !r.compat) continue;
    for (const c of r.compat) {
      const key = rawToKey[c.replace(/\s+/g, ' ').trim()];
      if (!key) continue;
      const vid = keyToId.get(key);
      if (vid) pairs.add(r.id + '|' + vid);
    }
  } catch {}
}
console.log(`Уникальных связей: ${pairs.size}`);

const rows = [...pairs].map(p => {
  const [part_id, vehicle_id] = p.split('|');
  return { part_id: +part_id, vehicle_id: +vehicle_id };
});

let done = 0, errors = 0;
const t0 = Date.now();
for (let i = 0; i < rows.length; i += 1000) {
  const chunk = rows.slice(i, i + 1000);
  const { error } = await s.from('part_vehicles').upsert(chunk, { onConflict: 'part_id,vehicle_id' });
  if (error) { errors += chunk.length; if (errors <= 3000) console.log('[ERR]', error.message); }
  else done += chunk.length;
  if ((i / 1000) % 20 === 0) console.log(`  ${i + chunk.length}/${rows.length} | ${((Date.now() - t0) / 1000).toFixed(0)}с`);
}
console.log(`Связи: залито ${done}, ошибок ${errors}`);

// --- 3. parts_count ---
console.log('Обновляю parts_count...');
const counts = new Map();
for (const r of rows) counts.set(r.vehicle_id, (counts.get(r.vehicle_id) || 0) + 1);
let cd = 0;
for (const [vid, cnt] of counts) {
  const { error } = await s.from('vehicles').update({ parts_count: cnt }).eq('id', vid);
  if (!error) cd++;
}
console.log(`parts_count обновлён у ${cd} авто`);

// --- контроль ---
const { count: vc } = await s.from('vehicles').select('*', { count: 'exact', head: true });
const { count: pc } = await s.from('part_vehicles').select('*', { count: 'exact', head: true });
console.log(`\n=== В БД: ${vc} авто, ${pc} связей ===`);
