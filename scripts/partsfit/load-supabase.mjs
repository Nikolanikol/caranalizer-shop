/**
 * Заливка таблиц из data/partsfit/tables/ в Supabase.
 *
 * Запуск: node scripts/partsfit/load-supabase.mjs           (залить всё)
 *         node scripts/partsfit/load-supabase.mjs --dry-run (только посчитать)
 *         node scripts/partsfit/load-supabase.mjs --only=products,offers
 *
 * Переменные окружения (положить в .env.local, в гит не коммитить):
 *   SUPABASE_URL=https://<проект>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *
 * Ключ нужен именно service_role: у таблиц включён RLS, и анонимному ключу разрешено
 * только чтение. Это не обход защиты, а её замысел — писать в каталог имеет право
 * только скрипт, и никогда браузер.
 *
 * Схему (`schema.sql`) надо применить один раз до первой заливки — вручную через SQL Editor
 * в Studio. Скрипт её не создаёт намеренно: DDL, выполняемый автоматически по расписанию,
 * однажды снесёт данные молча, и разбираться будут долго.
 */

import { readJson, tablePath } from './lib.mjs';
import { connect } from './target.mjs';

/** Порядок обязателен: внешние ключи ссылаются вверх по списку. */
const ORDER = [
  { file: 'brands', table: 'partsfit_brands', key: 'slug' },
  { file: 'models', table: 'partsfit_models', key: 'id' },
  { file: 'part_types', table: 'partsfit_part_types', key: 'slug' },
  { file: 'products', table: 'partsfit_products', key: 'id' },
  { file: 'offers', table: 'partsfit_offers', key: 'id' },
  { file: 'offer_images', table: 'partsfit_offer_images', key: 'offer_id,kind,position' },
  { file: 'fitment', table: 'partsfit_fitment', key: 'oem_number,part_type,model_id,side' },
];

/** Пачками: одним запросом на 70 тысяч строк упирается и в память, и в таймаут. */
const CHUNK = 500;

const flags = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');
const allowProd = flags.includes('--prod');
const only = flags.find((f) => f.startsWith('--only='))?.split('=')[1]?.split(',');
const plan = only ? ORDER.filter((step) => only.includes(step.file)) : ORDER;

const rows = new Map();
for (const step of plan) {
  const data = readJson(tablePath(step.file), null);
  if (!data) {
    console.error(`Нет файла ${step.file}.json. Сначала: npm run partsfit:tables -- <группа>`);
    process.exit(1);
  }
  rows.set(step.file, data);
}

console.log('К заливке:');
for (const step of plan) console.log(`  ${step.table.padEnd(24)} ${String(rows.get(step.file).length).padStart(7)} строк`);

if (dryRun) {
  console.log('\n--dry-run: ничего не отправлено.');
  process.exit(0);
}

const { admin: db } = connect({ allowProd });

for (const step of plan) {
  const data = rows.get(step.file);
  const conflict = step.key;
  let done = 0;

  for (let at = 0; at < data.length; at += CHUNK) {
    const chunk = data.slice(at, at + CHUNK);
    // upsert, а не insert: повторный прогон скрапера обязан обновлять цену и наличие,
    // а не падать на дубликатах и не плодить вторые копии товара.
    const { error } = await db.from(step.table).upsert(chunk, { onConflict: conflict });
    if (error) {
      console.error(`\n${step.table}: ${error.message}`);
      console.error(`  оборвалось на строках ${at}–${at + chunk.length}, залито ${done}`);
      process.exit(1);
    }
    done += chunk.length;
    process.stdout.write(`\r  ${step.table.padEnd(24)} ${done}/${data.length}`);
  }
  process.stdout.write('\n');
}

console.log('\nГотово. Проверить в Studio:');
console.log('  select part_type, count(*) from partsfit_products group by 1 order by 2 desc;');
