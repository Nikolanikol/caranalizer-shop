import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const lines0 = fs.readFileSync('.env', 'utf8').split('\n');
for (const l of lines0) { const m = l.match(/^([^#=]+)=(.*)$/); if (m) process.env[m[1].trim()] = m[2].trim(); }

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const rows = fs.readFileSync('data/translations_final.jsonl', 'utf8').trim().split('\n').map(l => JSON.parse(l));
const byId = new Map(rows.map(r => [r.id, r]));
console.log(`Переводов в файле: ${byId.size}`);

const PAGE = 1000;
let offset = 0;
let updated = 0, skipped = 0, errors = 0;
let testDone = false;
const t0 = Date.now();

while (true) {
  const { data, error } = await s.from('parts_staging')
    .select('*')
    .order('id', { ascending: true })
    .range(offset, offset + PAGE - 1);

  if (error) { console.error('Read error:', error.message); break; }
  if (!data || data.length === 0) break;

  const toWrite = [];
  for (const row of data) {
    const tr = byId.get(row.id);
    if (!tr) { skipped++; continue; }
    row.name_en = tr.name_en;
    row.name_ru = tr.name_ru;
    toWrite.push(row);
  }

  if (toWrite.length > 0) {
    // Первый батч — тест с проверкой
    if (!testDone) {
      const test = toWrite.slice(0, 10);
      const { error: te } = await s.from('parts_staging').upsert(test, { onConflict: 'id' });
      if (te) { console.error('ТЕСТ ПРОВАЛЕН:', te.message); process.exit(1); }
      const { data: check } = await s.from('parts_staging')
        .select('id,name_ko,name_en,name_ru').in('id', test.map(r => r.id));
      console.log('--- ТЕСТ 10 строк ---');
      for (const c of check.slice(0, 3)) console.log(`  ${c.name_ko} | ${c.name_en} | ${c.name_ru}`);
      if (!check.every(c => c.name_en && c.name_ru)) { console.error('Поля не заполнились!'); process.exit(1); }
      console.log('ТЕСТ ОК\n');
      testDone = true;
    }

    const { error: we } = await s.from('parts_staging').upsert(toWrite, { onConflict: 'id' });
    if (we) {
      errors += toWrite.length;
      console.log(`  [ERR] offset=${offset}: ${we.message}`);
    } else {
      updated += toWrite.length;
    }
  }

  offset += PAGE;
  if ((offset / PAGE) % 10 === 0) {
    const sec = ((Date.now() - t0) / 1000).toFixed(0);
    console.log(`  ${offset} прочитано | ${updated} обновлено | ${errors} err | ${sec}с`);
  }
}

console.log(`\n=== Готово: обновлено ${updated}, пропущено ${skipped}, ошибок ${errors} ===`);

const { count } = await s.from('parts_staging').select('*', { count: 'exact', head: true }).not('name_ru', 'is', null);
console.log(`Строк с name_ru в БД: ${count}`);
