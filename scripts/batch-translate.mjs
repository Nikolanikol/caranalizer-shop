import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const lines = fs.readFileSync('.env', 'utf8').split('\n');
for (const l of lines) { const m = l.match(/^([^#=]+)=(.*)$/); if (m) process.env[m[1].trim()] = m[2].trim(); }

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const { tr } = await import('./dict.mjs');
const { translate } = await import('bing-translate-api');

const OUT = path.join('data', 'translations.jsonl');
const BATCH = 10;
const PAUSE_MS = 300;

// Переводит массив EN-строк одним запросом (склейка через \n).
// Возвращает массив RU-строк или null при несовпадении/ошибке.
async function translateBatch(enArr) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await translate(enArr.join('\n'), 'en', 'ru');
      const out = res.translation.split('\n');
      if (out.length === enArr.length) return out;
      // Несовпадение строк — переводим по одной
      return await translateOneByOne(enArr);
    } catch (e) {
      await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
  return null;
}

async function translateOneByOne(enArr) {
  const out = [];
  for (const en of enArr) {
    try {
      const res = await translate(en, 'en', 'ru');
      out.push(res.translation);
    } catch (e) {
      out.push(null);
    }
    await new Promise(r => setTimeout(r, 300));
  }
  return out;
}

const PAGE = 1000;
let offset = 0;
let total = 0;
let errors = 0;

const seen = new Set();
if (fs.existsSync(OUT)) {
  const existing = fs.readFileSync(OUT, 'utf8').trim().split('\n').filter(Boolean);
  for (const line of existing) {
    try { seen.add(JSON.parse(line).id); } catch {}
  }
  console.log(`Найдено ${seen.size} уже переведённых, пропускаем`);
}

const fd = fs.openSync(OUT, 'a');

console.log(`Батч-перевод parts_staging через Bing (батчи по ${BATCH})\n`);
const startTime = Date.now();

while (true) {
  const { data, error } = await s.from('parts_staging')
    .select('id,part_number,name_ko')
    .not('name_ko', 'is', null)
    .order('id', { ascending: true })
    .range(offset, offset + PAGE - 1);

  if (error) { console.error('Supabase error:', error.message); break; }
  if (!data || data.length === 0) break;

  const pending = data.filter(r => !seen.has(r.id));

  for (let i = 0; i < pending.length; i += BATCH) {
    const chunk = pending.slice(i, i + BATCH);
    const enArr = chunk.map(r => tr(r.name_ko));
    const ruArr = await translateBatch(enArr);

    for (let j = 0; j < chunk.length; j++) {
      const ru = ruArr ? ruArr[j] : null;
      if (ru === null || ru === undefined) errors++;
      fs.writeSync(fd, JSON.stringify({
        id: chunk[j].id, part_number: chunk[j].part_number,
        name_ko: chunk[j].name_ko, name_en: enArr[j], name_ru: ru ?? null
      }) + '\n');
      total++;
    }

    await new Promise(r => setTimeout(r, PAUSE_MS));

    if (total % 500 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const speed = (total / (elapsed || 1)).toFixed(1);
      const eta = ((92000 - total - seen.size) / (speed || 1) / 60).toFixed(0);
      console.log(`  ${total + seen.size} / ~92000 | ${errors} err | ${speed}/с | ETA ~${eta} мин`);
    }
  }

  offset += PAGE;
}

fs.closeSync(fd);

const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
console.log(`\n=== Готово ===`);
console.log(`Переведено: ${total} (+ ${seen.size} ранее)`);
console.log(`Ошибок: ${errors}`);
console.log(`Время: ${elapsed} мин`);
console.log(`Файл: ${OUT}`);
