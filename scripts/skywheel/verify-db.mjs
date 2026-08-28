/**
 * Проверка таблиц дисков. Запуск: npm run skywheel:verify [-- --prod]
 *
 * Смысл тот же, что у `partsfit:verify`: не «посмотреть, что залилось», а поймать
 * то, что ломается только в проде — ограничение, которое не сработало; грант, забытый
 * поимённо; политику, пускающую анонима на запись. Поэтому здесь намеренно делаются
 * вещи, которые ОБЯЗАНЫ упасть.
 *
 * Гоняется дважды: по пустой базе ДО заливки — убедиться, что схема, права и RLS
 * легли, — и по полной ПОСЛЕ. Режим определяется по факту, а не флагом: флаг однажды
 * поставят не туда.
 *
 * Отказ печатается голой строкой, успех с примечанием — через note(). Это не
 * стилистика: на partsfit одиннадцать проверок печатали свой отказ зелёной галочкой,
 * и сверка числа строк на пустой базе рапортовала «✓ в базе 0, в файле 18655».
 */

import { resolve } from 'node:path';
import { connect } from '../partsfit/target.mjs';
import { DATA, readJson } from './lib.mjs';

const { admin, anon } = connect({
  allowProd: process.argv.includes('--prod'),
  needAnon: true,
});

let failures = 0;
const ok = (name, extra = '') => console.log(`  \x1b[32m✓\x1b[0m ${name}${extra ? ' — ' + extra : ''}`);
const fail = (name, why) => {
  failures++;
  console.log(`  \x1b[31m✗\x1b[0m ${name} — ${why}`);
};
const skip = (name, why) => console.log(`  \x1b[33m•\x1b[0m ${name} — ${why}`);
const note = (text) => ({ note: String(text) });

/**
 * Ограничение сработало — или таблицы просто нет?
 *
 * Обе ситуации дают ошибку на вставке, и без разбора кода прогон по проду ДО миграции
 * печатал «✓ картинка без диска отвергнута» на таблице, которой не существует. Это
 * тот же класс лжи, что и зелёный отказ: проверка, которая не может провалиться.
 *
 * Коды PostgreSQL: 23503 — внешний ключ, 23505 — уникальность, 23514 — check.
 * Отсутствие таблицы PostgREST отдаёт как PGRST205 или 42P01.
 */
function rejectedByConstraint(error) {
  const code = String(error?.code ?? '');
  if (['23503', '23505', '23514', '23502'].includes(code)) return true;
  if (['42P01', 'PGRST205', 'PGRST202'].includes(code)) return 'таблицы нет — миграция не применена';
  return `неожиданная ошибка (${code || 'без кода'}): ${error?.message ?? ''}`;
}

async function check(name, run) {
  try {
    const result = await run();
    if (result === true || result === undefined) ok(name);
    else if (result && typeof result === 'object' && typeof result.note === 'string') ok(name, result.note);
    else fail(name, String(result));
  } catch (error) {
    fail(name, error.message);
  }
}

const TABLES = ['skywheel_brands', 'skywheel_wheels', 'skywheel_wheel_images'];
const tableFile = (table) => resolve(DATA, 'tables', `${table}.json`);

const count = async (table) => {
  const { count: n, error } = await admin.from(table).select('*', { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  /*
   * `null` вместо числа значит, что таблицы нет либо PostgREST не видит её в кэше
   * схемы. Ошибку он при этом отдаёт не всегда, и без этой строки прогон по проду
   * ДО миграции печатал «✓ skywheel_wheel_images — null строк» зелёной галочкой,
   * а «НДС учтён — null позиций» выглядело как пройденная проверка.
   * Это ровно то, ради чего скрипт и написан: отказ не должен выглядеть галочкой.
   */
  if (n === null) throw new Error('таблицы нет либо PostgREST не видит её в кэше схемы');
  return n;
};

// Таблицы может не быть вовсе — первый прогон по проду делается до миграций.
// Тогда считаем базу пустой: про отсутствие внятно скажет секция «Схема на месте».
const empty = await count('skywheel_wheels').then((n) => n === 0).catch(() => true);
const contentCheck = (name, run) => (empty ? skip(name, 'база пустая') : check(name, run));

if (empty) {
  console.log(
    '\n\x1b[33mТаблица дисков пуста — это прогон ДО заливки.\x1b[0m Содержательные проверки\n' +
      'пропускаются: смотрим схему, права, ограничения и RLS — то, что на проде\n' +
      'расходится с локальным стеком и выясняется иначе уже после заливки.'
  );
}

console.log('');

console.log('Схема на месте:');
for (const table of TABLES) {
  await check(table, async () => note(`${await count(table)} строк`));
}

console.log('\nСтроки совпадают с файлами:');
for (const table of TABLES) {
  const expected = (readJson(tableFile(table), []) || []).length;
  await contentCheck(table, async () => {
    const actual = await count(table);
    return actual === expected ? note(`${actual}`) : `в базе ${actual}, в файле ${expected}`;
  });
}

console.log('\nОграничения ловят кривые данные (эти вставки обязаны упасть):');

// Работает и на пустой базе: внешний ключ не нуждается в данных.
await check('картинка без диска отвергнута', async () => {
  const { error } = await admin
    .from('skywheel_wheel_images')
    .insert({ wheel_id: 'нет-такого-диска', position: 0, url: 'x' });
  if (!error) {
    await admin.from('skywheel_wheel_images').delete().eq('wheel_id', 'нет-такого-диска');
    return 'сирота вставилась — внешний ключ не работает';
  }
  return rejectedByConstraint(error);
});

await check('диск с несуществующей маркой отвергнут', async () => {
  const row = {
    id: 'verify-brand',
    slug: 'verify-brand',
    brand_slug: 'нет-такой-марки',
    diameter: 19,
    title_ko: 'проверка',
    condition: 'used',
    price_krw: 1000,
    source_url: 'x',
  };
  const { error } = await admin.from('skywheel_wheels').insert(row);
  if (!error) {
    await admin.from('skywheel_wheels').delete().eq('id', row.id);
    return 'вставился — внешний ключ на марку не работает';
  }
  return rejectedByConstraint(error);
});

await contentCheck('дубль адреса диска отвергнут', async () => {
  const { data } = await admin.from('skywheel_wheels').select('*').limit(1);
  const twin = { ...data[0], id: `${data[0].id}--verify-twin` };
  const { error } = await admin.from('skywheel_wheels').insert(twin);
  if (!error) {
    await admin.from('skywheel_wheels').delete().eq('id', twin.id);
    return 'дубликат слага вставился — уникальный индекс не работает';
  }
  return true;
});

await contentCheck('состояние вне списка отвергнуто', async () => {
  const { data } = await admin.from('skywheel_wheels').select('*').limit(1);
  const bad = { ...data[0], id: 'verify-condition', slug: 'verify-condition', condition: 'выдумка' };
  const { error } = await admin.from('skywheel_wheels').insert(bad);
  if (!error) {
    await admin.from('skywheel_wheels').delete().eq('id', bad.id);
    return 'condition вне списка вставился — check-ограничение не работает';
  }
  return true;
});

// Цена может отсутствовать («по запросу»), но нулевой или отрицательной быть не может:
// по ней выставляется счёт.
await contentCheck('нулевая цена отвергнута, а отсутствие цены допустимо', async () => {
  const { data } = await admin.from('skywheel_wheels').select('*').limit(1);
  const zero = { ...data[0], id: 'verify-zero', slug: 'verify-zero', price_krw: 0 };
  const { error: zeroError } = await admin.from('skywheel_wheels').insert(zero);
  if (!zeroError) {
    await admin.from('skywheel_wheels').delete().eq('id', zero.id);
    return 'цена 0 вставилась — check-ограничение не работает';
  }
  const none = { ...data[0], id: 'verify-null', slug: 'verify-null', price_krw: null };
  const { error: nullError } = await admin.from('skywheel_wheels').insert(none);
  await admin.from('skywheel_wheels').delete().eq('id', none.id);
  return nullError ? `цена «по запросу» не вставилась: ${nullError.message}` : true;
});

console.log('\nДоступ (RLS):');
if (!anon) {
  skip('доступ анонимным ключом', 'нет ANON-ключа');
} else {
  // Читать обязаны ВСЕ три таблицы: грант выдаётся поимённо, и забытое имя
  // проявится не здесь, а пустой страницей раздела на живом сайте.
  await check('аноним читает все три таблицы', async () => {
    const closed = [];
    for (const table of TABLES) {
      const { count: n, error } = await anon.from(table).select('*', { head: true, count: 'exact' });
      // `null` без ошибки значит, что таблицы нет: PostgREST отдаёт 200 с пустым
      // счётчиком. Без этой ветки проверка зеленела на несуществующих таблицах —
      // а это ровно та проверка, от которой зависит, увидит ли покупатель каталог.
      if (error) closed.push(`${table}: ${error.message}`);
      else if (n === null) closed.push(`${table}: таблицы нет либо она не в кэше схемы`);
    }
    return closed.length ? closed.join('; ') : note(`${TABLES.length} таблицы открыты на чтение`);
  });

  await check('аноним НЕ может писать', async () => {
    const { error } = await anon.from('skywheel_wheels').insert({
      id: 'verify-anon-write',
      slug: 'verify-anon-write',
      brand_slug: 'bmw',
      diameter: 19,
      title_ko: 'x',
      condition: 'used',
      price_krw: 1000,
      source_url: 'x',
    });
    if (!error) {
      await admin.from('skywheel_wheels').delete().eq('id', 'verify-anon-write');
      return 'аноним записал строку — RLS или грант открыты на запись';
    }
    return true;
  });
}

console.log('\nЗапросы витрины:');

await contentCheck('список дисков', async () => {
  const started = Date.now();
  const { data, error } = await admin
    .from('skywheel_wheels')
    .select('id, slug, brand_slug, diameter, price_krw, skywheel_brands ( name ), skywheel_wheel_images ( url )')
    .eq('sold', false)
    .order('diameter', { ascending: false })
    .limit(15);
  if (error) return error.message;
  return note(`${data.length} за ${Date.now() - started} мс`);
});

await contentCheck('счётчики фильтра', async () => {
  const started = Date.now();
  const { data, error } = await admin
    .from('skywheel_wheels')
    .select('brand_slug, diameter')
    .eq('sold', false);
  if (error) return error.message;
  return note(`${data.length} строк за ${Date.now() - started} мс`);
});

console.log('\nСодержимое:');

await contentCheck('у каждого диска есть фотографии', async () => {
  const { data, error } = await admin.from('skywheel_wheel_images').select('wheel_id');
  if (error) return error.message;
  const withPhoto = new Set(data.map((row) => row.wheel_id)).size;
  const total = await count('skywheel_wheels');
  return withPhoto === total ? note(`${withPhoto} из ${total}`) : `без фото ${total - withPhoto} дисков`;
});

await contentCheck('цена есть у всех, кроме «по запросу»', async () => {
  const { data, error } = await admin.from('skywheel_wheels').select('id, price_krw, sold');
  if (error) return error.message;
  const none = data.filter((row) => row.price_krw === null);
  const live = none.filter((row) => !row.sold);
  return note(`без цены ${none.length}, из них в продаже ${live.length}`);
});

await contentCheck('проданное скрыто с витрины', async () => {
  const { count: sold, error } = await admin
    .from('skywheel_wheels')
    .select('*', { count: 'exact', head: true })
    .eq('sold', true);
  if (error) return error.message;
  if (sold === null) return 'таблицы нет либо PostgREST не видит её';
  return note(`${sold} помечено проданным и не попадает в список`);
});

await contentCheck('НДС учтён там, где продавец назвал его отдельно', async () => {
  const { count: vat, error } = await admin
    .from('skywheel_wheels')
    .select('*', { count: 'exact', head: true })
    .eq('vat_included', true);
  if (error) return error.message;
  if (vat === null) return 'таблицы нет либо PostgREST не видит её';
  return note(`${vat} позиций с налогом в цене`);
});

await check('чужие таблицы не задеты', async () => {
  // Боевая база общая с kmotors: 42 их таблицы в той же схеме. Проверяем, что каталог
  // запчастей на месте — если заливка дисков что-то зацепила, видно будет здесь.
  const { count: parts, error } = await admin
    .from('partsfit_products')
    .select('*', { count: 'exact', head: true });
  if (error) return `каталог запчастей не читается: ${error.message}`;
  return parts > 0 ? note(`partsfit_products на месте, ${parts} строк`) : 'каталог запчастей пуст';
});

console.log(
  failures
    ? `\n\x1b[31mПровалено проверок: ${failures}\x1b[0m`
    : '\n\x1b[32mВсе проверки пройдены.\x1b[0m'
);
process.exit(failures ? 1 : 0);
