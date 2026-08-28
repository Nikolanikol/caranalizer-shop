/**
 * Классификация объявлений skywheel.kr в записи товара.
 *
 * Запуск: node scripts/skywheel/classify.mjs
 *         node scripts/skywheel/classify.mjs --report   (только отчёт о покрытии)
 *
 * Читает data/skywheel/items.json, пишет data/skywheel/wheels.json и печатает,
 * что разобралось, а что нет. Непокрытые заголовки печатаются поимённо: словарь
 * пополняется по этому списку, а не наугад.
 *
 * Чего здесь намеренно НЕ происходит:
 *   - имя и телефон продавца в выходной файл не попадают. Это чужие персональные
 *     данные с чужой доски: они нужны закупщику, а не витрине, и в базу сайта
 *     их класть нельзя. Остаётся только признак `sellerRef` — кто из продавцов,
 *     без самого номера.
 *   - цена не переводится в рубли и доллары. Это делает lib/shop/pricing.ts
 *     из вон, по курсу ЦБ, и второго места для наценки быть не должно.
 */

import {
  BRAND_HINTS, CONDITIONS, GRADES, MAKERS, MODELS, QUANTITY, REGIONS, WHEEL_KINDS,
} from './dict.mjs';
import { itemsPath, itemUrl, readJson, wheelsPath, writeJson } from './lib.mjs';

/** «230만원» → 2 300 000 вон. 만 — это десять тысяч, и множитель терять нельзя. */
function parsePrice(label) {
  if (!label) return null;
  const man = label.match(/([\d,.]+)\s*만원/);
  if (man) return Math.round(Number(man[1].replace(/,/g, '')) * 10000);
  const won = label.match(/([\d,]{4,})\s*원/);
  return won ? Number(won[1].replace(/,/g, '')) : null;
}

const manToWon = (text) => Math.round(Number(text.replace(/,/g, '')) * 10000);

/**
 * Цена продажи, и только она.
 *
 * Поле донора `판매가격` — не всегда цена покупки. У кованых SW-xx он ставит в шапку
 * цену `대품시` — со сдачей своих дисков в зачёт, — а обычную покупку называет строкой
 * `일반 구매` в описании, на 300–400 тысяч вон дороже. Взяв поле, мы считали бы наценку
 * от суммы, за которую товар никто не продаёт: фактическая наценка выходила ×1.22–1.31
 * вместо ×1.5.
 *
 * Хуже того, эти объявления покрывают несколько диаметров сразу, и поле `사이즈`
 * у шести из девяти отвечает НЕ тому диаметру, чья цена стоит в шапке. Поэтому цена
 * берётся по диаметру, который мы показываем, а не по порядку в строке.
 *
 * Нет цены продажи для нашего диаметра — возвращаем null, и витрина пишет «по запросу».
 * Придумывать её нельзя: по этой цене выставляется счёт.
 */
function salePrice(item, diameter) {
  const listed = parsePrice(item.priceLabel);
  const rows = item.description.split('\n');

  // «대품 없이 220만원» — цена БЕЗ сдачи своих дисков в зачёт, то есть обычная покупка.
  // Второе написание того же, что и `일반 구매`, и ловить его надо отдельно: у пяти
  // объявлений поле оказалось зачётной ценой именно из-за этой формулировки.
  for (const row of rows) {
    const without = row.match(/대품\s*없이\s*([\d,.]+)\s*만원/);
    if (without) return manToWon(without[1]);
  }

  const line = rows.find((row) => row.includes('일반'));
  if (!line) {
    /*
     * Третье написание: «판매가 390만원이고 대품은 350만원 입니다» — продавец называет
     * цену продажи прямо, а в поле кладёт зачётную. Так у 78 объявлений, и у 76 из них
     * названная цена совпадает с полем; расхождений два.
     *
     * Потолок в двойную цену поля — защита от опечатки продавца, а не перестраховка:
     * в #98 стоит «판매가 1000만원» при зачёте 90만원, то есть лишний ноль. Настоящая
     * скидка за сдачу дисков — это 300–700 тысяч вон, а не десятикратная разница.
     */
    const stated = item.description.match(/판매가\s*([\d,.]+)\s*만원/);
    if (stated && listed) {
      const price = manToWon(stated[1]);
      if (price > listed && price <= listed * 2) return price;
    }
    return listed; // обычной цены отдельно нет — значит поле и есть она
  }

  const grid = [...line.matchAll(/(\d{2})\s*인치\s*([\d,.]+)\s*만원/g)];
  if (grid.length) {
    const found = grid.find(([, inch]) => Number(inch) === diameter);
    // Диаметра нет в прайсе продавца — назвать цену нечем.
    return found ? manToWon(found[2]) : null;
  }

  const single = [...line.matchAll(/([\d,.]+)\s*만원/g)];
  return single.length === 1 ? manToWon(single[0][1]) : null;
}

/** Ставка НДС в Корее. Донор называет её словами, но цифра везде одна. */
const VAT = 0.1;

/**
 * Назвал ли продавец НДС отдельно от цены.
 *
 * Две формулировки, и обе значат одно: цена в объявлении без налога.
 *   `(VAT별도)`                — «НДС отдельно», 13 объявлений;
 *   `카드는 부가세10%입니다`      — «картой +10% НДС», 14 объявлений.
 *
 * Второе формально про способ оплаты: наличными продавец готов не проводить сделку
 * по документам. Нам это не подходит — закупка идёт по инвойсу, — поэтому налог
 * закладываем в обоих случаях. Проверено: «НДС включён» не пишет ни одно объявление,
 * так что обратного случая нет.
 */
function vatSeparate(item) {
  return /vat|부가세|부과세/i.test(item.description);
}

/** Цена с налогом там, где продавец назвал его отдельно. Округляем до вона. */
function withVat(price, item) {
  if (price === null) return null;
  return vatSeparate(item) ? Math.round(price * (1 + VAT)) : price;
}

/*
 * Сравниваем без пробелов с обеих сторон: донор пишет и «제네시스 g90», и «제네시스g90».
 * Из-за этого «제네시스g90» не находил модель G90 и падал в общий запасной вариант
 * словаря, давая на витрине «Genesis Genesis».
 */
const flat = (text) => text.toLowerCase().replace(/\s+/g, '');
const has = (text, word) => flat(text).includes(flat(word));

function brandOf(item, blob) {
  for (const [brand, hints] of BRAND_HINTS) {
    if (hints.some((hint) => has(blob, hint))) return brand;
  }
  return MAKERS[item.maker] ?? null;
}

function modelOf(blob) {
  for (const [needle, model] of MODELS) if (has(blob, needle)) return model;
  return null;
}

function wheelKindOf(blob) {
  const found = WHEEL_KINDS.filter(([, hints]) => hints.some((hint) => has(blob, hint)));
  return found.length ? { code: found[0][0], ru: found[0][2] } : null;
}

function quantityOf(blob) {
  for (const [code, hints] of QUANTITY) if (hints.some((hint) => has(blob, hint))) return code;
  return null;
}

/**
 * Технические параметры подбора. У дисков они те же, чем у детали партномер:
 * ширина обода (J), разболтовка (PCD), вылет (ET) и посадочное отверстие (CB).
 * Донор их почти не заполняет — см. отчёт; поэтому здесь всё необязательное.
 */
function specsOf(blob) {
  const widths = [...blob.matchAll(/(\d{1,2}(?:\.\d)?)\s*j\b/g)].map((m) => Number(m[1]));
  const pcd = blob.match(/(?:pcd|피시디|피씨디)\s*[:\-]?\s*(\d{1,3}(?:\.\d)?)\s*[x*×]?\s*(\d{1,3}(?:\.\d)?)?/);
  const offsets = [...blob.matchAll(/(?:et|오프셋|옵셋)\s*[:\-]?\s*\+?\s*(\d{1,2})/g)].map((m) => Number(m[1]));
  const bore = blob.match(/(?:cb|허브|센터보어)\s*[:\-]?\s*(\d{2}(?:\.\d{1,2})?)/);
  const tyre = blob.match(/(\d{3})\s*[/／]\s*(\d{2})\s*[rz]?\s*(\d{2})/);

  return {
    widthsJ: [...new Set(widths)].sort((a, b) => a - b),
    pcd: pcd ? [pcd[1], pcd[2]].filter(Boolean).map(Number) : [],
    offsetsEt: [...new Set(offsets)].sort((a, b) => a - b),
    boreCb: bore ? Number(bore[1]) : null,
    tyre: tyre ? `${tyre[1]}/${tyre[2]}R${tyre[3]}` : null,
  };
}

function classify(item, sellers) {
  /*
   * Два разных текста, и путать их нельзя.
   *
   * Заголовок говорит, о чём объявление. Описание у кованого афтермаркета перечисляет
   * список совместимости: «SW03 подходит на Kia K9, Carnival, Land Rover…». Ищи мы
   * марку и модель по описанию — первое попавшееся имя выигрывало бы, и на витрине
   * появлялся «Land Rover Carnival»: марка из поля донора, модель из чужой строки
   * совместимости. Ровно это и вылезло на первой же сборке витрины.
   *
   * Поэтому марка и модель берутся ТОЛЬКО из заголовка. Параметры подбора и тип диска —
   * из описания тоже: там они про сам товар, а не про то, на что он встаёт.
   */
  const titleBlob = item.title.toLowerCase();
  const blob = `${item.title}\n${item.description}`.toLowerCase();
  const diameter = Number(item.size?.match(/(\d{2})/)?.[1]) || null;
  const specs = specsOf(blob);

  return {
    id: item.id,
    title: item.title.replace(/\[(인증|판매완료)\]/g, '').trim(),
    certified: item.title.includes('[인증]'), // метка донора «проверено»
    // Проданное с доски не исчезает, продавец лишь дописывает «[판매완료]» в заголовок.
    // Без этого флага товар уехал бы на витрину как имеющийся в наличии.
    sold: item.title.includes('판매완료'),
    brand: brandOf(item, titleBlob),
    maker: item.maker,
    model: modelOf(titleBlob),
    diameter,
    condition: CONDITIONS[item.kind] ?? null,
    grade: GRADES[item.grade] ?? null,
    wheelKind: wheelKindOf(blob),
    quantity: quantityOf(blob),
    withTyres: /휠타이어|휠 타이어|타이어/.test(blob),
    // Цена продажи с налогом. Порядок обязателен: НДС начисляется на цену продажи,
    // а не на поле донора — иначе у пяти позиций налог лёг бы на зачётную цену.
    priceKrw: withVat(salePrice(item, diameter), item),
    vatIncluded: vatSeparate(item),
    region: REGIONS[item.region] ?? item.region,
    sellerRef: sellers.get(item.sellerPhone) ?? null,
    images: item.images,
    descriptionKo: item.description,
    posted: item.posted,
    hits: item.hits,
    specs,
    // Ссылка на объявление у донора. Нужна и закупщику (по ней он звонит продавцу),
    // и нам: товар с доски исчезает, и проверять наличие можно только по источнику.
    sourceUrl: itemUrl(item.id),
  };
}

function report(rows) {
  const total = rows.length;
  const share = (n) => `${n}/${total} (${Math.round((n / total) * 100)}%)`;
  const count = (key) => rows.filter((r) => r[key] !== null && r[key] !== undefined).length;

  console.log(`\nОбъявлений: ${total}\n`);
  console.log('Разобралось:');
  console.log(`  марка          ${share(count('brand'))}`);
  console.log(`  модель авто    ${share(count('model'))}`);
  console.log(`  диаметр        ${share(count('diameter'))}`);
  console.log(`  новое/б-у      ${share(count('condition'))}`);
  console.log(`  состояние      ${share(count('grade'))}`);
  console.log(`  тип диска      ${share(count('wheelKind'))}`);
  console.log(`  комплектность  ${share(count('quantity'))}`);
  console.log(`  цена           ${share(count('priceKrw'))}`);
  console.log(`  фотографии     ${share(rows.filter((r) => r.images.length).length)}`);
  console.log(`  описание       ${share(rows.filter((r) => r.descriptionKo.length > 3).length)}`);
  console.log(`  помечено проданным ${rows.filter((r) => r.sold).length}`);
  console.log(`  НДС заложен в цену  ${rows.filter((r) => r.vatIncluded).length}`);

  console.log('\nПараметры подбора (донор их почти не заполняет):');
  console.log(`  ширина J       ${share(rows.filter((r) => r.specs.widthsJ.length).length)}`);
  console.log(`  PCD            ${share(rows.filter((r) => r.specs.pcd.length).length)}`);
  console.log(`  вылет ET       ${share(rows.filter((r) => r.specs.offsetsEt.length).length)}`);
  console.log(`  ступица CB     ${share(rows.filter((r) => r.specs.boreCb).length)}`);

  const tally = (key, get) => {
    const map = new Map();
    for (const row of rows) {
      const value = get(row) ?? '—';
      map.set(value, (map.get(value) ?? 0) + 1);
    }
    const sorted = [...map].sort((a, b) => b[1] - a[1]);
    console.log(`\n${key}: ${sorted.map(([k, n]) => `${k} ${n}`).join(', ')}`);
  };
  tally('Марки', (r) => r.brand);
  tally('Диаметр', (r) => (r.diameter ? `${r.diameter}"` : null));
  tally('Тип диска', (r) => r.wheelKind?.ru);
  tally('Состояние', (r) => r.grade?.ru);

  const noModel = rows.filter((r) => !r.model);
  if (noModel.length) {
    console.log(`\nБез модели авто — ${noModel.length}, словарь пополнять по ним:`);
    for (const row of noModel.slice(0, 25)) console.log(`  ${row.id}  ${row.title}`);
  }
  const noBrand = rows.filter((r) => !r.brand);
  if (noBrand.length) {
    console.log(`\nБез марки — ${noBrand.length}:`);
    for (const row of noBrand) console.log(`  ${row.id}  ${row.maker} | ${row.title}`);
  }
}

function main() {
  const items = readJson(itemsPath());
  if (!items) throw new Error('Нет data/skywheel/items.json — сначала node scripts/skywheel/scrape.mjs');

  // Продавцов на доске полтора десятка; в выходной файл идёт номер по порядку,
  // а не телефон. Самый крупный продавец — сам SkyWheel, и это его склад.
  const byVolume = [...items.reduce((map, item) => {
    map.set(item.sellerPhone, (map.get(item.sellerPhone) ?? 0) + 1);
    return map;
  }, new Map())].sort((a, b) => b[1] - a[1]);
  const sellers = new Map(byVolume.map(([phone], i) => [phone, `seller-${i + 1}`]));

  const rows = items.map((item) => classify(item, sellers));
  if (!process.argv.includes('--report')) {
    writeJson(wheelsPath(), rows);
    console.log(`Записано ${rows.length} в ${wheelsPath()}`);
  }
  report(rows);
  console.log(`\nПродавцов: ${sellers.size}, крупнейший (${[...sellers.values()][0]}) — ${byVolume[0][1]} объявлений`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
