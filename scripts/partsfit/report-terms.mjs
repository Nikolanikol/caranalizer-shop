/**
 * Полнота английского словаря каталога.
 *
 * Данные раскладываются по закрытым наборам терминов, и английская витрина переводит
 * именно их. Набор закрыт ровно до следующего скрапа: новая группа донора приносит новые
 * термины, и без этой проверки они молча уедут на английские страницы по-русски —
 * сборка не упадёт, глазами это ловится только случайно.
 *
 * Поэтому: гонять после каждого `partsfit:tables`.
 *
 * Словарь импортируется настоящий (`src/lib/shop/terms.ts`), а не переписанный сюда —
 * копия разошлась бы с оригиналом в первый же месяц.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TABLES = path.join(ROOT, 'data/partsfit/tables');

const { TERM_MAPS, CATEGORY_EN } = await import(path.join(ROOT, 'src/lib/shop/terms.ts'));

const read = async (name) => JSON.parse(await readFile(path.join(TABLES, name), 'utf8'));

/** Поле → где его искать. Списки и строки собираются одинаково. */
const SOURCES = {
  condition_ru: ['offers.json'],
  condition_notes: ['offers.json'],
  lamp_type_ru: ['offers.json'],
  completeness_ru: ['offers.json'],
  features_ru: ['offers.json'],
  side: ['products.json'],
  position: ['products.json'],
};

const cache = new Map();
async function rows(file) {
  if (!cache.has(file)) cache.set(file, await read(file));
  return cache.get(file);
}

let missing = 0;
let checked = 0;

for (const [field, files] of Object.entries(SOURCES)) {
  const counts = new Map();
  for (const file of files) {
    for (const row of await rows(file)) {
      const value = row[field];
      if (!value) continue;
      for (const one of Array.isArray(value) ? value : [value]) {
        counts.set(one, (counts.get(one) ?? 0) + 1);
      }
    }
  }

  const map = TERM_MAPS[field];
  if (!map) {
    console.log(`✗ ${field} — словаря нет вовсе`);
    missing += counts.size;
    continue;
  }

  const gaps = [...counts.entries()].filter(([value]) => !(value in map)).sort((a, b) => b[1] - a[1]);
  checked += counts.size;

  if (!gaps.length) {
    console.log(`✓ ${field} — ${counts.size} терминов, все переведены`);
  } else {
    console.log(`✗ ${field} — не переведено ${gaps.length} из ${counts.size}:`);
    for (const [value, n] of gaps) console.log(`    ${String(n).padStart(6)}  ${value}`);
    missing += gaps.length;
  }

  // Словарь шире данных — тоже сигнал: термин исчез у донора либо в ключе опечатка.
  const stale = Object.keys(map).filter((value) => !counts.has(value));
  if (stale.length) console.log(`  ⚠️ в словаре есть лишнее (в данных не встречается): ${stale.join(', ')}`);
}

// Типы деталей приходят не из полей, а из реестра категорий.
const types = new Set((await rows('products.json')).map((row) => row.part_type));
const typeGaps = [...types].filter((slug) => !(slug in CATEGORY_EN));
checked += types.size;
if (!typeGaps.length) {
  console.log(`✓ типы деталей — ${types.size}, все переведены`);
} else {
  console.log(`✗ типы деталей — не переведено ${typeGaps.length}: ${typeGaps.join(', ')}`);
  missing += typeGaps.length;
}

console.log(
  missing
    ? `\n✗ Непокрытых терминов: ${missing}. Дописать в src/lib/shop/terms.ts.`
    : `\n✓ Словарь полон: ${checked} терминов, непокрытых нет.`,
);
process.exit(missing ? 1 : 0);
