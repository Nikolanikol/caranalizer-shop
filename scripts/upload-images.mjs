import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLines = fs.readFileSync('.env', 'utf8').split('\n');
for (const l of envLines) { const m = l.match(/^([^#=]+)=(.*)$/); if (m) process.env[m[1].trim()] = m[2].trim(); }

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// --- читаем и дедуплицируем: последняя ok-запись по id ---
const lines = fs.readFileSync('data/partsro-images.jsonl', 'utf8').trim().split('\n');
const byId = new Map();
for (const l of lines) {
  try {
    const r = JSON.parse(l);
    if (r.status === 'ok' && r.image_url) byId.set(r.id, r.image_url);
  } catch {}
}
console.log(`Уникальных товаров с картинкой: ${byId.size}`);

const PAGE = 1000;
let offset = 0;
let updated = 0, skipped = 0, errors = 0;
let testDone = false;
const t0 = Date.now();

while (true) {
  const { data, error } = await s.from('parts_products')
    .select('*')
    .order('id', { ascending: true })
    .range(offset, offset + PAGE - 1);
  if (error) { console.error('Read error:', error.message); break; }
  if (!data || data.length === 0) break;

  const toWrite = [];
  for (const row of data) {
    const url = byId.get(row.id);
    if (!url) { skipped++; continue; }
    row.image_url = url;
    toWrite.push(row);
  }

  if (toWrite.length > 0) {
    if (!testDone) {
      const test = toWrite.slice(0, 10);
      const { error: te } = await s.from('parts_products').upsert(test, { onConflict: 'id' });
      if (te) { console.error('ТЕСТ ПРОВАЛЕН:', te.message); process.exit(1); }
      const { data: check } = await s.from('parts_products').select('id,part_number,image_url').in('id', test.map(r => r.id));
      console.log('--- ТЕСТ 10 строк ---');
      for (const c of check.slice(0, 3)) console.log(`  id=${c.id} ${c.part_number} → ${c.image_url.slice(0, 70)}`);
      if (!check.every(c => c.image_url && c.image_url.includes('partsro'))) { console.error('Не обновилось!'); process.exit(1); }
      console.log('ТЕСТ ОК\n');
      testDone = true;
    }

    const { error: we } = await s.from('parts_products').upsert(toWrite, { onConflict: 'id' });
    if (we) { errors += toWrite.length; console.log(`[ERR] offset=${offset}: ${we.message}`); }
    else updated += toWrite.length;
  }

  offset += PAGE;
  if ((offset / PAGE) % 10 === 0) {
    const sec = ((Date.now() - t0) / 1000).toFixed(0);
    console.log(`  ${offset} прочитано | ${updated} обновлено | ${errors} err | ${sec}с`);
  }
}

console.log(`\n=== Готово: обновлено ${updated}, пропущено ${skipped}, ошибок ${errors} ===`);
const { count } = await s.from('parts_products').select('*', { count: 'exact', head: true }).like('image_url', '%partsro%');
console.log(`Товаров с partsro-картинкой в БД: ${count}`);
