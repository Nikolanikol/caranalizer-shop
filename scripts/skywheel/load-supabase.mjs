/**
 * Заливка таблиц из data/skywheel/tables/ в Supabase.
 *
 * Запуск: node scripts/skywheel/load-supabase.mjs           (залить всё)
 *         node scripts/skywheel/load-supabase.mjs --dry-run (только посчитать)
 *         node scripts/skywheel/load-supabase.mjs --prod    (в боевую базу)
 *
 * Защита от «залил не туда» переиспользуется из scripts/partsfit/target.mjs, а не
 * копируется: она проверяет адрес с обеих сторон (без --prod не пойдёт в прод,
 * с --prod не пойдёт в локальную), и второй экземпляр этой логики неизбежно разъедется
 * с первым. База у обоих доноров одна и та же.
 *
 * Схему миграцией надо применить до первой заливки. Скрипт её не создаёт намеренно:
 * DDL, выполняемый автоматически, однажды снесёт данные молча.
 */

import { resolve } from 'node:path';
import { connect } from '../partsfit/target.mjs';
import { DATA, readJson } from './lib.mjs';

/** Порядок обязателен: внешние ключи ссылаются вверх по списку. */
const ORDER = [
  { table: 'skywheel_brands', key: 'slug' },
  { table: 'skywheel_wheels', key: 'id' },
  { table: 'skywheel_wheel_images', key: 'wheel_id,position' },
];

const CHUNK = 500;

const flags = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');
const allowProd = flags.includes('--prod');

const rows = new Map();
for (const step of ORDER) {
  const data = readJson(resolve(DATA, 'tables', `${step.table}.json`), null);
  if (!data) {
    console.error(`Нет файла ${step.table}.json. Сначала: npm run skywheel:tables`);
    process.exit(1);
  }
  rows.set(step.table, data);
}

console.log('К заливке:');
for (const step of ORDER) {
  console.log(`  ${step.table.padEnd(24)} ${String(rows.get(step.table).length).padStart(6)} строк`);
}

if (dryRun) {
  console.log('\n--dry-run: ничего не отправлено.');
  process.exit(0);
}

const { admin: db } = connect({ allowProd });

for (const step of ORDER) {
  const data = rows.get(step.table);
  let done = 0;

  for (let at = 0; at < data.length; at += CHUNK) {
    const chunk = data.slice(at, at + CHUNK);
    // upsert, а не insert: повторный прогон скрапера обязан обновлять цену и признак
    // продажи, а не падать на дубликатах и не плодить вторые копии товара.
    const { error } = await db.from(step.table).upsert(chunk, { onConflict: step.key });
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

console.log('\nГотово. Проверить:');
console.log('  select brand_slug, count(*) from skywheel_wheels group by 1 order by 2 desc;');
