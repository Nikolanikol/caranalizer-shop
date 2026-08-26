/**
 * Проверка базы после заливки. Запуск: npm run partsfit:verify
 *
 * Смысл скрипта — не «посмотреть, что залилось», а поймать то, что ломается только
 * в проде: ограничение, которое не сработало; политику доступа, пускающую анонима
 * на запись; запрос витрины, идущий полным перебором на тридцати тысячах строк.
 *
 * Поэтому здесь не просто SELECT COUNT. Здесь namеренно делаются вещи, которые
 * ОБЯЗАНЫ упасть: вставка дубликата адреса, вставка сироты, запись анонимным ключом.
 * Если такое проходит — база собрана неправильно, и на проде это выяснится позже
 * и дороже.
 *
 * Прогоняется сначала локально (supabase start), потом теми же глазами по проду.
 */

import { readJson, tablePath } from './lib.mjs';
import { connect } from './target.mjs';

const { admin, anon } = connect({ allowProd: process.argv.includes('--prod'), needAnon: true });

let failures = 0;
const ok = (name, extra = '') => console.log(`  [32m✓[0m ${name}${extra ? ' — ' + extra : ''}`);
const fail = (name, why) => {
  failures++;
  console.log(`  [31m✗[0m ${name} — ${why}`);
};
const skip = (name, why) => console.log(`  [33m•[0m ${name} — ${why}`);

/**
 * Успех с примечанием возвращается через note(), отказ — просто строкой.
 *
 * Раньше строка означала и то и другое, и одиннадцать проверок печатали свой отказ
 * зелёной галочкой: «✓ partsfit_products — в базе 0, в файле 18655». Проверка,
 * которая не может провалиться, хуже отсутствующей: она даёт уверенность, которой нет.
 */
const note = (text) => ({ note: String(text) });

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

const TABLES = [
  ['brands', 'partsfit_brands'],
  ['models', 'partsfit_models'],
  ['part_types', 'partsfit_part_types'],
  ['products', 'partsfit_products'],
  ['offers', 'partsfit_offers'],
  ['offer_images', 'partsfit_offer_images'],
  ['fitment', 'partsfit_fitment'],
];

const VIEWS = ['partsfit_brand_counts', 'partsfit_model_counts'];

const count = async (table) => {
  const { count: n, error } = await admin.from(table).select('*', { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  return n;
};

/*
 * Проверка гоняется дважды: по пустой базе ДО заливки — убедиться, что права,
 * ограничения и RLS легли, — и по полной ПОСЛЕ. На пустой базе содержательные
 * проверки провалились бы все разом и утопили бы в шуме то единственное, ради чего
 * прогон и делается. Поэтому режим определяется по факту, а не флагом: флаг однажды
 * поставят не туда.
 */
// Таблицы может не быть вовсе — первый прогон по проду делается до миграций.
// Тогда считаем базу пустой: про отсутствие внятно скажет секция «Схема на месте»,
// а не стектрейс поверх всего вывода.
const empty = await count('partsfit_products').then((n) => n === 0).catch(() => true);
const contentCheck = (name, run) => (empty ? skip(name, 'база пустая') : check(name, run));

if (empty) {
  console.log(
    '\n\x1b[33mБаза пуста — это прогон ДО заливки.\x1b[0m Содержательные проверки пропускаются:\n' +
      'смотрим схему, права, ограничения и RLS — то, что на проде расходится с локальным\n' +
      'стеком и выясняется иначе уже после того, как 314 тысяч строк уехали.'
  );
}

console.log('');

// 0. Все объекты на месте и доступны сервисному ключу. Первая проверка не случайно
//    такая: забытая миграция и незагруженный кэш схемы PostgREST выглядят одинаково —
//    «relation does not exist» — и валят всё остальное каскадом. Лучше сказать это
//    одной строкой в начале, чем двадцатью невнятными отказами ниже.
console.log('Схема на месте:');
for (const name of [...TABLES.map(([, table]) => table), ...VIEWS]) {
  await check(name, async () => note(`${await count(name)} строк`));
}

// 1. Столько же строк, сколько в файлах. Расхождение значит, что заливка оборвалась
//    на середине, а такое молча пережить нельзя.
console.log('\nСтроки совпадают с файлами:');
for (const [file, table] of TABLES) {
  const expected = (readJson(tablePath(file), []) || []).length;
  await contentCheck(table, async () => {
    const actual = await count(table);
    return actual === expected ? note(`${actual}`) : `в базе ${actual}, в файле ${expected}`;
  });
}

console.log('\nОграничения ловят кривые данные (эти вставки обязаны упасть):');

await contentCheck('дубль адреса детали отвергнут', async () => {
  const { data } = await admin.from('partsfit_products').select('*').limit(1);
  const twin = { ...data[0], id: `${data[0].id}--verify-twin` };
  const { error } = await admin.from('partsfit_products').insert(twin);
  if (!error) {
    await admin.from('partsfit_products').delete().eq('id', twin.id);
    return 'дубликат вставился — уникальный индекс не работает';
  }
  return true;
});

// Единственная проверка ограничений, которой не нужны данные: сирота ссылается
// на несуществующую деталь, и на пустой базе это тоже внешний ключ. Поэтому она
// работает и в прогоне ДО заливки.
await check('экземпляр без детали отвергнут', async () => {
  const { error } = await admin.from('partsfit_offers').insert({
    id: 'verify-orphan',
    product_id: 'нет-такой-детали',
    title_ko: 'проверка',
    price_krw: 1,
  });
  if (!error) {
    await admin.from('partsfit_offers').delete().eq('id', 'verify-orphan');
    return 'сирота вставилась — внешний ключ не работает';
  }
  return true;
});

await contentCheck('неизвестный грейд состояния допустим только из списка', async () => {
  const { data } = await admin.from('partsfit_offer_images').select('*').limit(1);
  const { error } = await admin
    .from('partsfit_offer_images')
    .insert({ ...data[0], position: 999, kind: 'выдумка' });
  if (!error) {
    await admin.from('partsfit_offer_images').delete().eq('offer_id', data[0].offer_id).eq('kind', 'выдумка');
    return 'kind вне списка вставился — check-ограничение не работает';
  }
  return true;
});

console.log('\nДоступ (RLS):');
if (!anon) {
  skip('доступ анонимным ключом', 'нет ANON-ключа: SUPABASE_ANON_KEY или NEXT_PUBLIC_SUPABASE_ANON_KEY');
} else {
  // Читать обязаны ВСЕ таблицы и представления, а не одна. Грант выдаётся поимённо,
  // и забытое имя проявится не здесь, а пустой страницей на живом сайте.
  await check('аноним читает все таблицы и представления', async () => {
    const closed = [];
    for (const name of [...TABLES.map(([, table]) => table), ...VIEWS]) {
      const { error } = await anon.from(name).select('*', { head: true, count: 'exact' });
      if (error) closed.push(`${name}: ${error.message}`);
    }
    return closed.length ? closed.join('; ') : note(`${TABLES.length + VIEWS.length} объектов открыто на чтение`);
  });

  await check('аноним НЕ может писать', async () => {
    const { error } = await anon.from('partsfit_products').insert({
      id: 'verify-anon-write',
      group_key: 'x',
      part_type: 'perednie-fary',
      brand_slug: 'bmw',
      slug: 'x',
      title_ru: 'x',
      oem_number: 'X',
    });
    if (!error) {
      await admin.from('partsfit_products').delete().eq('id', 'verify-anon-write');
      return 'запись прошла — каталог открыт на изменение любому';
    }
    return true;
  });

  await contentCheck('аноним НЕ может удалять', async () => {
    const { data } = await admin.from('partsfit_products').select('id').limit(1);
    const { error, count: removed } = await anon
      .from('partsfit_products')
      .delete({ count: 'exact' })
      .eq('id', data[0].id);
    if (!error && removed > 0) return 'удаление прошло — данные можно снести анонимным ключом';
    return true;
  });
}

console.log('\nЗапросы витрины отвечают:');

await contentCheck('поиск по артикулу', async () => {
  const { data: sample } = await admin.from('partsfit_products').select('oem_number').limit(1);
  const started = Date.now();
  const { data, error } = await admin
    .from('partsfit_products')
    .select('id, title_ru, oem_number')
    .eq('oem_number', sample[0].oem_number);
  if (error) throw new Error(error.message);
  return note(`${data.length} найдено за ${Date.now() - started} мс`);
});

await contentCheck('листинг по типу и марке', async () => {
  const started = Date.now();
  const { data, error } = await admin
    .from('partsfit_products')
    .select('id, title_ru, price_krw_min, offers_count')
    .eq('part_type', 'perednie-fary')
    .eq('brand_slug', 'hyundai')
    .order('price_krw_min')
    .limit(24);
  if (error) throw new Error(error.message);
  return note(`${data.length} за ${Date.now() - started} мс`);
});

await contentCheck('деталь со своими экземплярами одним запросом', async () => {
  const { data: sample } = await admin
    .from('partsfit_products')
    .select('id')
    .order('offers_count', { ascending: false })
    .limit(1);
  const started = Date.now();
  const { data, error } = await admin
    .from('partsfit_products')
    .select('id, title_ru, partsfit_offers(id, price_krw, condition_grade, donor_vin, partsfit_offer_images(url))')
    .eq('id', sample[0].id)
    .single();
  if (error) throw new Error(error.message);
  const photos = data.partsfit_offers.reduce((sum, o) => sum + o.partsfit_offer_images.length, 0);
  return note(`${data.partsfit_offers.length} экземпляров, ${photos} фото за ${Date.now() - started} мс`);
});

await contentCheck('поиск по кросс-номеру', async () => {
  const { data: sample } = await admin
    .from('partsfit_products')
    .select('cross_numbers')
    .not('cross_numbers', 'eq', '{}')
    .limit(1);
  if (!sample.length) return 'кросс-номеров в базе нет';
  const started = Date.now();
  const { data, error } = await admin
    .from('partsfit_products')
    .select('id')
    .contains('cross_numbers', [sample[0].cross_numbers[0]]);
  if (error) throw new Error(error.message);
  return note(`${data.length} найдено за ${Date.now() - started} мс`);
});

// Счётчики фильтра. Их считают представления из третьей миграции — единственной,
// которая не создаёт таблиц и потому пропускается легче прочих. Забыть её значит
// уронить страницы марки и модели: без них витрина 1,7 секунды группирует в Node.
await contentCheck('счётчики марок совпадают с товарами', async () => {
  const { data, error } = await admin
    .from('partsfit_brand_counts')
    .select('products')
    .eq('part_type', 'perednie-fary')
    .eq('brand_slug', 'hyundai')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return 'представление ничего не вернуло по фарам Hyundai';
  const { count: n } = await admin
    .from('partsfit_products')
    .select('*', { count: 'exact', head: true })
    .eq('part_type', 'perednie-fary')
    .eq('brand_slug', 'hyundai');
  return data.products === n ? note(`${n} — сходится`) : `представление ${data.products}, товаров ${n}`;
});

await contentCheck('счётчики моделей отвечают', async () => {
  const started = Date.now();
  const { data, error } = await admin
    .from('partsfit_model_counts')
    .select('model_slug, products')
    .eq('part_type', 'perednie-fary')
    .eq('brand_slug', 'hyundai')
    .order('products', { ascending: false })
    .limit(10);
  if (error) throw new Error(error.message);
  if (!data.length) return 'ни одной модели не вернулось';
  return note(`${data.length} моделей за ${Date.now() - started} мс`);
});


/*
 * Проверки совместимости сверяют базу с файлом, а не считают агрегат запросом:
 * PostgREST отдаёт не больше тысячи строк за раз, и агрегат по 14 669 строкам молча
 * посчитался бы по первой тысяче. Проверка, смотрящая на 7% данных, хуже отсутствующей —
 * она даёт уверенность, которой нет.
 */
const fitmentFile = readJson(tablePath('fitment'), []) || [];

await contentCheck('совместимость: артикул ведёт на несколько машин', async () => {
  const cars = new Map();
  for (const row of fitmentFile) {
    if (!cars.has(row.oem_number)) cars.set(row.oem_number, new Set());
    cars.get(row.oem_number).add(row.model_id);
  }
  const many = [...cars.entries()].filter(([, set]) => set.size > 1);
  if (!many.length) return 'ни одного артикула на нескольких машинах';

  // Берём самый «широкий» номер и спрашиваем базу — совпадёт ли с файлом.
  const [oem, expected] = many.sort((a, b) => b[1].size - a[1].size)[0];
  const { data, error } = await admin.from('partsfit_fitment').select('model_id').eq('oem_number', oem);
  if (error) throw new Error(error.message);
  const got = new Set(data.map((row) => row.model_id));
  if (got.size !== expected.size) return `${oem}: в базе ${got.size} машин, в файле ${expected.size}`;
  return note(`${many.length} артикулов на 2+ машинах; ${oem} — ${got.size} машин, сходится`);
});

await contentCheck('совместимость: нет строк без модели', async () => {
  const { count: n, error } = await admin
    .from('partsfit_fitment')
    .select('*', { count: 'exact', head: true })
    .is('model_id', null);
  if (error) throw new Error(error.message);
  return n === 0 ? true : `${n} строк без модели`;
});

await contentCheck('совместимость: отсев сработал', async () => {
  const products = readJson(tablePath('products'), []) || [];
  const types = new Map();
  const sides = new Map();
  for (const product of products) {
    if (!types.has(product.oem_number)) types.set(product.oem_number, new Set());
    types.get(product.oem_number).add(product.part_type);
    if (product.side) {
      if (!sides.has(product.oem_number)) sides.set(product.oem_number, new Set());
      sides.get(product.oem_number).add(product.side);
    }
  }
  const dirty = [...new Set([
    ...[...types].filter(([, set]) => set.size > 1).map(([oem]) => oem),
    ...[...sides].filter(([, set]) => set.size > 1).map(([oem]) => oem),
  ])];
  if (!dirty.length) return note('отсеивать нечего');

  const inFitment = new Set(fitmentFile.map((row) => row.oem_number));
  const leaked = dirty.filter((oem) => inFitment.has(oem));
  if (leaked.length) return `${leaked.length} спорных артикулов попали в таблицу: ${leaked.slice(0, 3).join(', ')}`;

  // Заодно убеждаемся, что база согласна с файлом: спорного номера в ней быть не должно.
  const { count: n, error } = await admin
    .from('partsfit_fitment')
    .select('*', { count: 'exact', head: true })
    .eq('oem_number', dirty[0]);
  if (error) throw new Error(error.message);
  return n === 0 ? note(`${dirty.length} спорных артикулов отсеяно`) : `${dirty[0]} есть в базе, хотя отсеян`;
});

console.log('\nСодержимое похоже на правду:');

await contentCheck('нет деталей без экземпляров', async () => {
  const { data, error } = await admin.from('partsfit_products').select('id').eq('offers_count', 0).limit(5);
  if (error) throw new Error(error.message);
  return data.length ? `${data.length}+ пустых страниц: ${data.map((r) => r.id).join(', ')}` : true;
});

await contentCheck('нет нулевых и отрицательных цен', async () => {
  const { count: n, error } = await admin
    .from('partsfit_offers')
    .select('*', { count: 'exact', head: true })
    .lte('price_krw', 0);
  if (error) throw new Error(error.message);
  return n === 0 ? true : `${n} экземпляров с ценой <= 0`;
});

await contentCheck('годы в разумных пределах', async () => {
  const { count: n, error } = await admin
    .from('partsfit_offers')
    .select('*', { count: 'exact', head: true })
    .or('year.lt.1985,year.gt.2028');
  if (error) throw new Error(error.message);
  return n === 0 ? true : `${n} экземпляров с негодным годом`;
});

await contentCheck('у каждого экземпляра есть фотографии', async () => {
  const images = readJson(tablePath('offer_images'), []) || [];
  const withPhoto = new Set(images.filter((i) => i.kind === 'photo').map((i) => i.offer_id));
  const offers = readJson(tablePath('offers'), []) || [];
  const without = offers.filter((o) => !withPhoto.has(o.id)).length;
  return without === 0 ? true : `${without} экземпляров без единого фото`;
});

console.log(
  failures
    ? `\n[31mПровалено проверок: ${failures}. В прод в таком виде нельзя.[0m`
    : empty
      ? '\n[32mСхема, права и доступ в порядке.[0m База пуста — залить и прогнать ещё раз.'
      : '\n[32mВсе проверки пройдены.[0m'
);
process.exitCode = failures ? 1 : 0;
