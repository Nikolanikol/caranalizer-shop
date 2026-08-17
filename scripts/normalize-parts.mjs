/**
 * Нормализация каталога: src/data/raw_parts.json -> src/data/catalog.json
 *
 * Запуск: npm run normalize:parts
 *
 * Единственный надёжный источник в сырых данных — поле titleKr, корейский заголовок донора.
 * Остальные поля скрапер заполнял разбором на лету и местами промахнулся: у 135 записей
 * в brand попала сторона («правый (RH)»), у 784 в titleRu остались иероглифы, side
 * противоречит заголовку. Поэтому brand / model / year / side / position / titleRu
 * собираются заново из titleKr, а не чинятся по месту.
 *
 * Формат titleKr (совпадает у всех 967 записей):
 *   [тег] <бренд> <модель> <год> <тип детали>(<позиция>/<сторона>) <партномер>
 *   현대 쏘나타 2019 테일램프(외측/좌) 92401L1000
 *   [중고] 포르쉐 카이엔 2011 테일램프(외측/좌)
 *   혼다 CR-V 2013 포그램프(좌) 33950TVAA01
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Корейские марки -> международные английские. Латинские (BMW) остаются как есть. */
const BRANDS = {
  현대: { name: 'Hyundai', ru: 'Хендай', aliases: ['Хёндай', 'Хундай'] },
  기아: { name: 'Kia', ru: 'Киа', aliases: [] },
  제네시스: { name: 'Genesis', ru: 'Дженесис', aliases: [] },
  KG모빌리티: { name: 'SsangYong', ru: 'Санг Йонг', aliases: ['KGM', 'KG Mobility', 'СсангЙонг'] },
  GM대우: { name: 'Chevrolet', ru: 'Шевроле', aliases: ['Daewoo', 'GM Daewoo', 'Дэу'] },
  르노: { name: 'Renault', ru: 'Рено', aliases: ['Renault Samsung', 'Renault Korea'] },
  벤츠: { name: 'Mercedes-Benz', ru: 'Мерседес', aliases: ['Mercedes', 'Бенц'] },
  아우디: { name: 'Audi', ru: 'Ауди', aliases: [] },
  폭스바겐: { name: 'Volkswagen', ru: 'Фольксваген', aliases: ['VW'] },
  포르쉐: { name: 'Porsche', ru: 'Порше', aliases: [] },
  푸조: { name: 'Peugeot', ru: 'Пежо', aliases: [] },
  볼보: { name: 'Volvo', ru: 'Вольво', aliases: [] },
  미니: { name: 'Mini', ru: 'Мини', aliases: ['MINI Cooper'] },
  랜드로버: { name: 'Land Rover', ru: 'Ленд Ровер', aliases: ['Range Rover'] },
  포드: { name: 'Ford', ru: 'Форд', aliases: [] },
  지프: { name: 'Jeep', ru: 'Джип', aliases: [] },
  닛산: { name: 'Nissan', ru: 'Ниссан', aliases: [] },
  크라이슬러: { name: 'Chrysler', ru: 'Крайслер', aliases: [] },
  인피니티: { name: 'Infiniti', ru: 'Инфинити', aliases: [] },
  혼다: { name: 'Honda', ru: 'Хонда', aliases: [] },
  렉서스: { name: 'Lexus', ru: 'Лексус', aliases: [] },
  재규어: { name: 'Jaguar', ru: 'Ягуар', aliases: [] },
  테슬라: { name: 'Tesla', ru: 'Тесла', aliases: [] },
  캐딜락: { name: 'Cadillac', ru: 'Кадиллак', aliases: [] },
  미츠비시: { name: 'Mitsubishi', ru: 'Мицубиси', aliases: ['Митсубиши'] },
  사이언: { name: 'Scion', ru: 'Сайон', aliases: [] },
  닷지: { name: 'Dodge', ru: 'Додж', aliases: [] },
  북기은상: { name: 'BAIC', ru: 'БАИК', aliases: ['Beijing', 'Бэйцзин'] },
  BMW: { name: 'BMW', ru: 'БМВ', aliases: [] },
};

/**
 * Модели: корейское написание -> международное английское.
 * Кириллица идёт отдельно в MODELS_RU — это ключевые слова для поиска, а не имя модели.
 */
const MODELS_KO = {
  // BMW / Mercedes — серии и классы английским написанием
  '1시리즈': '1 Series',
  '2시리즈': '2 Series',
  '3시리즈': '3 Series',
  '4시리즈': '4 Series',
  '5시리즈': '5 Series',
  '7시리즈': '7 Series',
  X시리즈: 'X Series',
  'A-클래스': 'A-Class',
  'B-클래스': 'B-Class',
  'C-클래스': 'C-Class',
  'E-클래스': 'E-Class',
  'S-클래스': 'S-Class',
  'CLK-클래스': 'CLK-Class',
  'CLS-클래스': 'CLS-Class',
  'GLA-클래스': 'GLA-Class',
  'GLC-클래스': 'GLC-Class',
  'GLE-클래스': 'GLE-Class',
  'M-클래스': 'M-Class',
  'SLK-클래스': 'SLK-Class',
  // Hyundai
  쏘나타: 'Sonata',
  아반떼: 'Elantra',
  그랜저: 'Grandeur',
  싼타페: 'Santa Fe',
  투싼: 'Tucson',
  베라크루즈: 'Veracruz',
  베르나: 'Verna',
  벨로스터: 'Veloster',
  에쿠스: 'Equus',
  엑센트: 'Accent',
  아이오닉: 'Ioniq',
  코나: 'Kona',
  베뉴: 'Venue',
  테라칸: 'Terracan',
  팰리세이드: 'Palisade',
  포터: 'Porter',
  제네시스: 'Genesis',
  // Kia
  레이: 'Ray',
  로체: 'Lotze',
  모닝: 'Picanto',
  모하비: 'Mohave',
  스펙트라: 'Spectra',
  스포티지: 'Sportage',
  쏘렌토: 'Sorento',
  쏘울: 'Soul',
  오피러스: 'Opirus',
  카니발: 'Carnival',
  카렌스: 'Carens',
  포르테: 'Forte',
  프라이드: 'Pride',
  // SsangYong
  렉스턴: 'Rexton',
  로디우스: 'Rodius',
  무쏘: 'Musso',
  액티언: 'Actyon',
  체어맨: 'Chairman',
  카이런: 'Kyron',
  코란도: 'Korando',
  티볼리: 'Tivoli',
  // Chevrolet / Daewoo
  라세티: 'Lacetti',
  레조: 'Rezzo',
  마티즈: 'Matiz',
  말리부: 'Malibu',
  베리타스: 'Veritas',
  스파크: 'Spark',
  알페온: 'Alpheon',
  올란도: 'Orlando',
  윈스톰: 'Winstorm',
  젠트라: 'Gentra',
  캡티바: 'Captiva',
  크루즈: 'Cruze',
  토스카: 'Tosca',
  트랙스: 'Trax',
  // Renault
  캡처: 'Captur',
  // Volkswagen
  골프: 'Golf',
  비틀: 'Beetle',
  아테온: 'Arteon',
  제타: 'Jetta',
  투아렉: 'Touareg',
  티구안: 'Tiguan',
  티록: 'T-Roc',
  파사트: 'Passat',
  페이톤: 'Phaeton',
  // Porsche
  마칸: 'Macan',
  박스터: 'Boxster',
  카이엔: 'Cayenne',
  파나메라: 'Panamera',
  // Ford / Lincoln
  에비에이터: 'Aviator',
  이스케이프: 'Escape',
  익스플로러: 'Explorer',
  컨티넨탈: 'Continental',
  타운카: 'Town Car',
  토러스: 'Taurus',
  포커스: 'Focus',
  // Jeep / Chrysler / Dodge / Cadillac
  '그랜드 체로키': 'Grand Cherokee',
  레니게이드: 'Renegade',
  컴패스: 'Compass',
  네온: 'Neon',
  캘리버: 'Caliber',
  에스컬레이드: 'Escalade',
  // Land Rover
  디스커버리: 'Discovery',
  레인지로버: 'Range Rover',
  프리랜더: 'Freelander',
  // Nissan / Infiniti / Honda / Mini / Tesla
  알티마: 'Altima',
  큐브: 'Cube',
  푸가: 'Fuga',
  어코드: 'Accord',
  컨트리맨: 'Countryman',
  쿠퍼: 'Cooper',
  클럽맨: 'Clubman',
  '모델 3': 'Model 3',
  '모델 X': 'Model X',
  '모델 Y': 'Model Y',
};

/**
 * Кириллические написания моделей — только ключевые слова для поиска.
 * Русский покупатель ищет и «Sonata», и «Соната», поэтому в keywords уезжает оба.
 */
const MODELS_RU = {
  Sonata: ['Соната'],
  Elantra: ['Элантра', 'Аванте', 'Avante'],
  Grandeur: ['Грандер', 'Azera'],
  'Santa Fe': ['Санта Фе', 'Санта-Фе'],
  Tucson: ['Туксон', 'Тусон'],
  Veracruz: ['Веракруз'],
  Equus: ['Эквус'],
  Accent: ['Акцент'],
  Verna: ['Верна'],
  Solaris: ['Солярис'],
  Creta: ['Крета'],
  Palisade: ['Палисад'],
  Kona: ['Кона'],
  Ioniq: ['Ионик'],
  Genesis: ['Дженесис'],
  Sportage: ['Спортейдж', 'Спортаж'],
  Sorento: ['Соренто'],
  Carnival: ['Карнивал', 'Sedona'],
  Picanto: ['Пиканто', 'Morning'],
  Mohave: ['Мохав', 'Borrego'],
  Forte: ['Форте', 'Cerato', 'Серато'],
  Pride: ['Прайд', 'Rio', 'Рио'],
  Opirus: ['Опирус', 'Amanti'],
  Lotze: ['Лотце', 'Magentis', 'Оптима'],
  Soul: ['Соул'],
  Ray: ['Рей'],
  Korando: ['Корандо'],
  Rexton: ['Рекстон'],
  Actyon: ['Актион', 'Актион Спорт'],
  Kyron: ['Кайрон'],
  Musso: ['Муссо'],
  Chairman: ['Чейрман'],
  Tivoli: ['Тиволи'],
  Rodius: ['Родиус'],
  Cruze: ['Круз', 'Крузе'],
  Captiva: ['Каптива'],
  Lacetti: ['Лачетти'],
  Matiz: ['Матиз'],
  Malibu: ['Малибу'],
  Spark: ['Спарк'],
  Orlando: ['Орландо'],
  Gentra: ['Джентра', 'Aveo', 'Авео'],
  Winstorm: ['Винсторм', 'Captiva'],
  Tosca: ['Тоска', 'Epica', 'Эпика'],
  Trax: ['Тракс'],
  Alpheon: ['Альфеон'],
  Cayenne: ['Кайен', 'Кайенн'],
  Macan: ['Макан'],
  Panamera: ['Панамера'],
  Boxster: ['Бокстер'],
  Tiguan: ['Тигуан'],
  Passat: ['Пассат'],
  Touareg: ['Туарег'],
  Golf: ['Гольф'],
  Jetta: ['Джетта'],
  Phaeton: ['Фаэтон'],
  Arteon: ['Артеон'],
  Beetle: ['Жук'],
  Explorer: ['Эксплорер'],
  Escape: ['Эскейп'],
  Focus: ['Фокус'],
  Taurus: ['Таурус'],
  'Grand Cherokee': ['Гранд Чероки'],
  Renegade: ['Ренегат'],
  Compass: ['Компас'],
  Discovery: ['Дискавери'],
  'Range Rover': ['Рендж Ровер'],
  Freelander: ['Фрилендер'],
  Altima: ['Альтима'],
  Cube: ['Куб'],
  Fuga: ['Фуга'],
  Accord: ['Аккорд'],
  'Model 3': ['Модель 3'],
  'Model X': ['Модель X'],
  'Model Y': ['Модель Y'],
  Escalade: ['Эскалейд'],
  Countryman: ['Кантримен'],
  Cooper: ['Купер'],
  Clubman: ['Клабмен'],
};

/**
 * Корейские дилеры продают Lincoln под маркой Ford. Для покупателя это разные машины,
 * и ищет он «Линкольн», поэтому по модели переносим запись в правильную марку.
 */
const LINCOLN_MODELS = new Set(['MKS', 'MKZ', 'Aviator', 'Continental', 'Town Car']);

/** '기타' = «прочее», моделью не является. */
const NOT_A_MODEL = new Set(['기타', '', '-']);

/**
 * Тип детали: корейское название -> категория маршрута и русские тексты.
 *
 * Сегменты адреса — транслит русских слов, а не английские: магазин для РФ, и адрес
 * в сниппете Яндекса должен читаться покупателем. Транслитератора здесь нет намеренно —
 * слов ровно шесть (две категории, две стороны, два расположения), они заданы строками.
 * Так не возникнет сюрпризов с «ы», «ь» и «ё» при добавлении новых категорий.
 */
const CATEGORIES = {
  테일램프: {
    slug: 'zadnie-fonari',
    ru: 'Фонарь задний',
    gender: 'm',
    keywords: ['фонарь', 'задний фонарь', 'стоп', 'стоп-сигнал', 'фонарь задний'],
  },
  포그램프: {
    slug: 'protivotumannye-fary',
    ru: 'Противотуманная фара',
    gender: 'f',
    keywords: ['противотуманка', 'птф', 'противотуманная фара', 'туманка'],
  },
};

const SIDE = {
  좌: { ru: { m: 'левый', f: 'левая' }, full: 'Левый (LH)', slug: 'levyy', kw: ['левый', 'LH', 'водительский'] },
  우: { ru: { m: 'правый', f: 'правая' }, full: 'Правый (RH)', slug: 'pravyy', kw: ['правый', 'RH', 'пассажирский'] },
};

const POSITION = {
  외측: { ru: 'внешний', full: 'Внешний (в крыло)', slug: 'naruzhnyy', kw: ['внешний', 'в крыло', 'наружный'] },
  내측: { ru: 'внутренний', full: 'Внутренний (в крышку багажника)', slug: 'vnutrenniy', kw: ['внутренний', 'в крышку', 'в багажник'] },
};

/** Модель у донора не указана у 17 записей — им нужен сегмент-заглушка, иначе ломается уровень. */
const NO_MODEL_SLUG = 'prochee';

/** [중고] = б/у, [애프터마켓] = неоригинал. Второе покупателю знать обязательно. */
const TAGS = { 중고: { used: true }, 애프터마켓: { aftermarket: true } };

/**
 * Год привязан к типу детали (…램프), иначе у Пежо с числовыми моделями — 2008, 3008, 5008 —
 * годом становится имя модели: «푸조 2008 2019 테일램프» разбирался как модель «» и год 2008.
 */
const TITLE_RE = /^(?:\[(?<tag>[^\]]*)\]\s*)?(?<brand>\S+)\s+(?<model>.*?)\s*(?<year>\d{4})\s+(?<rest>\S*램프\(.+)$/;
const REST_RE = /^(?<type>[^(]+)\((?:(?<position>[^/)]+)\/)?(?<side>[^)]+)\)\s*(?<oem>.*)$/;

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hasKorean(value) {
  return /[가-힣]/.test(String(value || ''));
}

/**
 * Дата публикации у донора. Своего поля с датой в сырых данных нет, но донор кладёт
 * фотографии в папку по дню загрузки: .../big/20260803/f61e07…jpg — и так у всех 967 записей.
 * Это единственный настоящий признак свежести, поэтому «последние поступления» на витрине
 * считаются по нему, а не выдумываются.
 */
function listedAt(images) {
  const found = String(images?.[0] || '').match(/\/(20\d{2})(\d{2})(\d{2})\//);
  return found ? `${found[1]}-${found[2]}-${found[3]}` : '';
}

/** Партномер из заголовка: «1», «3», «2» — это мусор донора, а не артикул. */
function cleanOem(value) {
  const first = String(value || '').trim().split(/\s+/)[0] || '';
  return /^[0-9A-Z][0-9A-Z-]{4,}$/i.test(first) ? first.toUpperCase() : '';
}

const raw = JSON.parse(readFileSync(resolve(root, 'src/data/raw_parts.json'), 'utf8'));

const problems = { unparsed: [], unknownBrand: new Set(), unknownModel: new Set(), koreanLeft: [], noOem: 0 };
const seenSlugs = new Map();
const catalog = [];

for (const item of raw) {
  const parsed = String(item.titleKr || '').trim().match(TITLE_RE);
  if (!parsed) {
    problems.unparsed.push(item.titleKr);
    continue;
  }

  const { tag, brand: brandKo, model: modelKo, year, rest } = parsed.groups;
  const detail = rest.match(REST_RE);
  if (!detail) {
    problems.unparsed.push(item.titleKr);
    continue;
  }

  const category = CATEGORIES[detail.groups.type.trim()];
  const side = SIDE[detail.groups.side.trim()];
  const position = detail.groups.position ? POSITION[detail.groups.position.trim()] : null;
  if (!category || !side) {
    problems.unparsed.push(item.titleKr);
    continue;
  }

  const brandInfo = BRANDS[brandKo] || { name: brandKo, ru: '', aliases: [] };
  if (!BRANDS[brandKo]) problems.unknownBrand.add(brandKo);

  const modelRaw = modelKo.trim();
  let model = NOT_A_MODEL.has(modelRaw) ? '' : MODELS_KO[modelRaw] || modelRaw;
  if (model && hasKorean(model)) problems.unknownModel.add(modelRaw);

  // Lincoln, проданный корейцами как Ford
  let brand = brandInfo.name;
  let brandRu = brandInfo.ru;
  if (brand === 'Ford' && LINCOLN_MODELS.has(model)) {
    brand = 'Lincoln';
    brandRu = 'Линкольн';
  }

  const oem = cleanOem(detail.groups.oem);
  if (!oem) problems.noOem += 1;

  const tagInfo = TAGS[String(tag || '').trim()] || {};

  // Заголовок собирается заново, а не чинится: в исходном titleRu сторона и марка перепутаны.
  const sideRu = side.ru[category.gender];
  const titleRu = [
    category.ru,
    sideRu,
    position ? position.ru : '',
    brand,
    model,
    `(${year})`,
  ]
    .filter(Boolean)
    .join(' ');

  // Адрес товара — /<категория>/<марка>/<модель>/<лист>. Марка и модель вынесены
  // в отдельные сегменты, потому что это ещё и посадочные страницы: «фонарь задний BMW 5 Series»
  // ищут именно так. Здесь считаем их слаги, полный путь собирает partUrl() в lib/catalog.ts.
  const brandSlug = slugify(brand);
  const modelSlug = slugify(model) || NO_MODEL_SLUG;

  // Лист: расположение, сторона, партномер. Уникальность обязательна, но только внутри
  // своей марки и модели — по этому адресу будет жить страница.
  const base = [position ? position.slug : '', side.slug, oem || year]
    .filter(Boolean)
    .map(slugify)
    .filter(Boolean)
    .join('-');

  // Один партномер честно повторяется: на разборке это два разных физических фонаря,
  // две отдельные позиции. Поэтому дубли не схлопываем, а разводим суффиксом.
  const scope = `${category.slug}/${brandSlug}/${modelSlug}/${base}`;
  let slug = base;
  if (seenSlugs.has(scope)) {
    const n = seenSlugs.get(scope) + 1;
    seenSlugs.set(scope, n);
    slug = `${base}-${n}`;
  } else {
    seenSlugs.set(scope, 1);
  }

  const keywords = [
    brand,
    brandRu,
    ...brandInfo.aliases,
    model,
    ...(MODELS_RU[model] || []),
    model ? `${brand} ${model}` : '',
    // «Хендай Соната» — так запрос и выглядит в Яндексе, целиком кириллицей
    ...(brandRu && model ? (MODELS_RU[model] || [model]).map((m) => `${brandRu} ${m}`) : []),
    oem,
    oem.replace(/-/g, ''),
    ...(item.crossNumbers || []),
    ...category.keywords,
    ...side.kw,
    ...(position ? position.kw : []),
    String(year),
  ].filter(Boolean);

  catalog.push({
    id: item.id,
    slug,
    brandSlug,
    modelSlug,
    category: category.slug,
    categoryRu: category.ru,
    titleRu,
    titleKr: item.titleKr,
    oemNumber: oem,
    crossNumbers: item.crossNumbers || [],
    brand,
    brandRu,
    model,
    year: Number(year),
    years: item.years || String(year),
    generation: item.generation || '',
    side: side.full,
    position: position ? position.full : '',
    condition: item.condition,
    conditionGrade: item.conditionGrade,
    conditionNotes: item.conditionNotes,
    // Донор торгует разбором: б/у по умолчанию, кроме явно помеченных [애프터마켓].
    used: !tagInfo.aftermarket,
    aftermarket: tagInfo.aftermarket ?? false,
    // Рублей в каталоге нет намеренно: цену считает lib/pricing.ts по тем же
    // RUB_PER_KRW и MARKUP. Иначе при смене курса каталог начнёт врать.
    priceKrw: item.priceKrw,
    stock: item.stock,
    deliveryDays: item.deliveryDays,
    images: item.images || [],
    listedAt: listedAt(item.images),
    connectorPins: item.connectorPins || '',
    weightKg: item.weightKg,
    dimensionsCm: item.dimensionsCm,
    sourceUrl: item.sourceUrl || '',
    verifiedOem: Boolean(oem),
    // Только то, под чем деталь стояла у донора. Совместимость не обещаем —
    // решение принимает покупатель по фото и партномеру.
    fitmentCompatibility: [[brand, model, `(${year})`].filter(Boolean).join(' ')],
    keywords: [...new Set(keywords.map((k) => String(k).trim()).filter(Boolean))],
  });
}

for (const part of catalog) {
  if (hasKorean(part.titleRu) || hasKorean(part.brand) || hasKorean(part.model)) {
    problems.koreanLeft.push(`${part.slug} :: ${part.titleRu}`);
  }
}

writeFileSync(resolve(root, 'src/data/catalog.json'), JSON.stringify(catalog, null, 2));

const byCategory = catalog.reduce((acc, p) => ({ ...acc, [p.category]: (acc[p.category] || 0) + 1 }), {});

console.log(`Каталог: ${catalog.length} из ${raw.length} записей -> src/data/catalog.json`);
console.log('  по категориям:', byCategory);
console.log(`  без партномера: ${problems.noOem}`);

// Проверяем полный путь, а не лист: лист уникален только внутри своей марки и модели.
const paths = new Set(catalog.map((p) => `${p.category}/${p.brandSlug}/${p.modelSlug}/${p.slug}`));
console.log(`  уникальных адресов: ${paths.size} (должно совпадать с числом товаров)`);
console.log(`  посадочных: марок ${new Set(catalog.map((p) => `${p.category}/${p.brandSlug}`)).size}`, `моделей ${new Set(catalog.map((p) => `${p.category}/${p.brandSlug}/${p.modelSlug}`)).size}`);
if (paths.size !== catalog.length) {
  console.error(`\nАДРЕСА НЕ УНИКАЛЬНЫ: ${catalog.length - paths.size} совпадений. Каталог в таком виде публиковать нельзя.`);
  process.exitCode = 1;
}

if (problems.unparsed.length) {
  console.log(`\nНе разобрано заголовков: ${problems.unparsed.length}`);
  problems.unparsed.slice(0, 10).forEach((t) => console.log('  ', t));
}
if (problems.unknownBrand.size) {
  console.log('\nМарки без перевода (добавь в BRANDS):', [...problems.unknownBrand].join(', '));
}
if (problems.unknownModel.size) {
  console.log('\nМодели без перевода (добавь в MODELS_KO):', [...problems.unknownModel].join(', '));
}
if (problems.koreanLeft.length) {
  console.log(`\nКорейские символы остались в ${problems.koreanLeft.length} записях:`);
  problems.koreanLeft.slice(0, 10).forEach((t) => console.log('  ', t));
} else {
  console.log('\nКорейских символов в названиях не осталось.');
}
