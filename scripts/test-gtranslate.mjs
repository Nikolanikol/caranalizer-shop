import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const lines = fs.readFileSync('.env', 'utf8').split('\n');
for (const l of lines) { const m = l.match(/^([^#=]+)=(.*)$/); if (m) process.env[m[1].trim()] = m[2].trim(); }

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Импортируем KO_EN словарь из основного файла
const { KO_EN, tr } = await import('./dict.mjs');

// Google Translate
const { translate } = await import('google-translate-api-x');

async function translateToRu(enText) {
  try {
    const res = await translate(enText, { from: 'en', to: 'ru' });
    return res.text;
  } catch (e) {
    return '[ОШИБКА: ' + e.message + ']';
  }
}

// Берём 50 рандомных staging
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

console.log(`\n=== ТЕСТ: KO → EN (словарь) → RU (Google Translate) — ${items.length} позиций ===\n`);

let ok = 0, total = items.length;

for (let i = 0; i < items.length; i++) {
  const r = items[i];
  const en = tr(r.name_ko);
  const ru = await translateToRu(en);

  console.log(`${i+1}. KO: ${r.name_ko}`);
  console.log(`   EN: ${en}`);
  console.log(`   RU: ${ru}`);
  console.log('');

  // Небольшая пауза чтобы не задолбить API
  if (i % 10 === 9) await new Promise(r => setTimeout(r, 1000));
}

console.log(`=== Готово: ${total} позиций ===`);
