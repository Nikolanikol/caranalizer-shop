/**
 * Что из снятого индекса словарь ещё не покрывает.
 *
 * Запуск: node scripts/partsfit/report-coverage.mjs headlights
 *         node scripts/partsfit/report-coverage.mjs headlights --oem   (только с партномером)
 *
 * Это рабочий инструмент под каждую новую группу: снял индекс — посмотрел отчёт —
 * дописал словарь — снял детали. Незнакомый термин не должен молча уезжать на витрину,
 * поэтому непокрытое здесь считается, а в таблицы (build-tables.mjs) не попадает.
 *
 * Список отсортирован по числу позиций: сорок верхних строк словаря обычно закрывают
 * больше товара, чем весь остальной хвост.
 */

import { groupByName, indexPath, readJson } from './lib.mjs';
import { PART_TYPES, parseTitle, resolveBrand, resolveModel } from './parse.mjs';

const [groupName, ...flags] = process.argv.slice(2);
if (!groupName) {
  console.error('Укажи группу: node scripts/partsfit/report-coverage.mjs headlights');
  process.exit(1);
}

const group = groupByName(groupName);
const onlyOem = flags.includes('--oem');
const rows = readJson(indexPath(groupName), null);
if (!rows) {
  console.error(`Индекса нет. Сначала: node scripts/partsfit/scrape-index.mjs ${groupName}`);
  process.exit(1);
}

const count = (map, key, by = 1) => map.set(key, (map.get(key) || 0) + by);
const unparsed = [];
const types = new Map();
const brands = new Map();
const models = new Map();
let withOem = 0;
let considered = 0;

for (const row of rows) {
  const parsed = parseTitle(row.titleKr);
  if (!parsed) {
    unparsed.push(row.titleKr);
    continue;
  }
  if (parsed.oem) withOem++;
  if (onlyOem && !parsed.oem) continue;
  considered++;

  if (!PART_TYPES[parsed.typeKo]) count(types, parsed.typeKo);
  if (!resolveBrand(parsed.brandKo).known) count(brands, parsed.brandKo);
  if (!resolveModel(parsed.modelKo).known) count(models, `${parsed.brandKo} ${parsed.modelKo}`);
}

const top = (map, limit = 40) =>
  [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
const positions = (map) => [...map.values()].reduce((sum, n) => sum + n, 0);

console.log(`Группа «${group.ru}»: ${rows.length} позиций в индексе`);
console.log(`  с партномером: ${withOem} (${Math.round((withOem / rows.length) * 100)}%)`);
console.log(`  заголовок не разобран: ${unparsed.length}`);
unparsed.slice(0, 5).forEach((title) => console.log(`     ${title}`));
console.log(onlyOem ? `  считаем только позиции с партномером: ${considered}\n` : '');

for (const [label, map, hint] of [
  ['ТИПЫ ДЕТАЛЕЙ', types, 'dict/part-types.json'],
  ['МАРКИ', brands, 'dict/brands.json'],
  ['МОДЕЛИ', models, 'dict/models.json'],
]) {
  const total = positions(map);
  console.log(`${label}: не в словаре ${map.size} терминов, это ${total} позиций -> ${hint}`);
  if (!map.size) {
    console.log('  всё покрыто\n');
    continue;
  }
  for (const [term, n] of top(map)) console.log(`  ${String(n).padStart(5)}  ${term}`);
  if (map.size > 40) console.log(`  … и ещё ${map.size - 40} терминов на ${total - positions(new Map(top(map)))} позиций`);
  console.log();
}
