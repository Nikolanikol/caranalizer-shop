import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const lines = fs.readFileSync('.env', 'utf8').split('\n');
for (const l of lines) { const m = l.match(/^([^#=]+)=(.*)$/); if (m) process.env[m[1].trim()] = m[2].trim(); }

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { tr } = await import('./dict.mjs');
const { translate } = await import('google-translate-api-x');

// Берём 50 рандомных
const offsets = [];
for (let i = 0; i < 60; i++) offsets.push(Math.floor(Math.random() * 92000));
offsets.sort((a, b) => a - b);

const stg = [];
for (const off of offsets) {
  const { data } = await s.from('parts_staging').select('id,part_number,name_ko')
    .not('name_ko', 'is', null)
    .range(off, off)
    .order('id', { ascending: true });
  if (data && data[0]) stg.push(data[0]);
}
const seen = new Set();
const items = stg.filter(r => { if (seen.has(r.part_number)) return false; seen.add(r.part_number); return true; }).slice(0, 50);

console.log(`=== ТЕСТ МАССИВНОГО РЕЖИМА: ${items.length} позиций, батчи по 10 ===\n`);

const BATCH = 10;
const t0 = Date.now();

for (let i = 0; i < items.length; i += BATCH) {
  const chunk = items.slice(i, i + BATCH);
  const enArr = chunk.map(r => tr(r.name_ko));

  try {
    const res = await translate(enArr, { from: 'en', to: 'ru', forceBatch: false, rejectOnPartialFail: false });
    if (!Array.isArray(res) || res.length !== enArr.length) {
      console.log(`  [БАТЧ ${i / BATCH + 1}] ОШИБКА: вернулось ${Array.isArray(res) ? res.length : typeof res} вместо ${enArr.length}`);
      continue;
    }
    for (let j = 0; j < chunk.length; j++) {
      console.log(`${i + j + 1}. KO: ${chunk[j].name_ko}`);
      console.log(`   EN: ${enArr[j]}`);
      console.log(`   RU: ${res[j] ? res[j].text : '[NULL]'}`);
      console.log('');
    }
  } catch (e) {
    console.log(`  [БАТЧ ${i / BATCH + 1}] ОШИБКА: ${e.message}`);
  }

  await new Promise(r => setTimeout(r, 500));
}

const sec = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`=== Готово за ${sec}с (${(items.length / sec).toFixed(1)} зап/с) ===`);
