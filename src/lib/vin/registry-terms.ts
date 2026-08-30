/**
 * Термины корейского реестра car365 → языки страницы проверки.
 *
 * **Ключ — код, а не корейское слово.** Портал публикует полные таблицы прямо в коде
 * страницы (`colorArray` и `fuelArray` в `schdcarXportView.do`), и наборы там закрытые:
 * 11 цветов и 18 видов топлива. Первая версия этого словаря сопоставляла корейский
 * текст из `colorNm`/`useFuelNm` и считалась принципиально неполной — это была ошибка:
 * рядом в ответе лежат `colorCd` и `useFuelCd`, а к ним есть официальная расшифровка.
 *
 * Корейские названия оставлены запасным путём: если реестр однажды пришлёт код,
 * которого в таблицах нет, лучше показать слово, чем прочерк.
 *
 * Язык подставляется здесь, на границе показа, а не в слое данных — `sources.ts`
 * отдаёт и код, и оригинал как есть.
 */

/** Языки страницы проверки. Их три — она единственная такая на сайте. */
type VinTextLocale = 'ru' | 'en' | 'ar';
type Row = Record<VinTextLocale, string>;

/** `colorArray` портала. Код 11 — «не указан», у портала он подписан прочерками. */
const COLOR_CODES: Record<string, Row> = {
  '01': { ru: 'чёрный', en: 'black', ar: 'أسود' },
  '02': { ru: 'белый', en: 'white', ar: 'أبيض' },
  '03': { ru: 'серый', en: 'grey', ar: 'رمادي' },
  '04': { ru: 'красный', en: 'red', ar: 'أحمر' },
  '05': { ru: 'коричневый', en: 'brown', ar: 'بني' },
  '06': { ru: 'жёлтый', en: 'yellow', ar: 'أصفر' },
  '07': { ru: 'синий', en: 'blue', ar: 'أزرق' },
  '08': { ru: 'зелёный', en: 'green', ar: 'أخضر' },
  '09': { ru: 'фиолетовый', en: 'purple', ar: 'بنفسجي' },
  '10': { ru: 'слоновая кость', en: 'ivory', ar: 'عاجي' },
  '11': { ru: 'не указан', en: 'not specified', ar: 'غير محدد' },
};

/** `fuelArray` портала. Буквенные коды, гибриды разведены по основному топливу. */
const FUEL_CODES: Record<string, Row> = {
  a: { ru: 'бензин', en: 'petrol', ar: 'بنزين' },
  b: { ru: 'дизель', en: 'diesel', ar: 'ديزل' },
  c: { ru: 'газ (LPG)', en: 'LPG', ar: 'غاز البترول المسال' },
  d: { ru: 'керосин', en: 'kerosene', ar: 'كيروسين' },
  e: { ru: 'электро', en: 'electric', ar: 'كهرباء' },
  f: { ru: 'спирт', en: 'alcohol', ar: 'كحول' },
  g: { ru: 'этилированный бензин', en: 'leaded petrol', ar: 'بنزين مرصص' },
  h: { ru: 'неэтилированный бензин', en: 'unleaded petrol', ar: 'بنزين خالٍ من الرصاص' },
  i: { ru: 'солнечная энергия', en: 'solar', ar: 'طاقة شمسية' },
  j: { ru: 'метан (CNG)', en: 'CNG', ar: 'غاز طبيعي مضغوط' },
  k: { ru: 'сжиженный газ (LNG)', en: 'LNG', ar: 'غاز طبيعي مسال' },
  l: { ru: 'гибрид (бензин)', en: 'hybrid (petrol)', ar: 'هجين (بنزين)' },
  m: { ru: 'гибрид (дизель)', en: 'hybrid (diesel)', ar: 'هجين (ديزل)' },
  n: { ru: 'гибрид (LPG)', en: 'hybrid (LPG)', ar: 'هجين (غاز)' },
  o: { ru: 'гибрид (CNG)', en: 'hybrid (CNG)', ar: 'هجين (غاز مضغوط)' },
  p: { ru: 'гибрид (LNG)', en: 'hybrid (LNG)', ar: 'هجين (غاز مسال)' },
  q: { ru: 'водород', en: 'hydrogen', ar: 'هيدروجين' },
  z: { ru: 'другое', en: 'other', ar: 'أخرى' },
};

/** Запасной путь по корейскому названию — на случай кода вне таблиц портала. */
const COLOR_NAMES: Record<string, string> = {
  검정색: '01', 검은색: '01', 흰색: '02', 회색: '03', 쥐색: '03', 은색: '03',
  빨간색: '04', 빨강색: '04', 적색: '04', 갈색: '05', 노란색: '06', 노랑색: '06',
  파란색: '07', 파랑색: '07', 청색: '07', 녹색: '08', 초록색: '08', 자주색: '09',
  상아색: '10',
};

const FUEL_NAMES: Record<string, string> = {
  휘발유: 'a', 경유: 'b', LPG: 'c', 액화석유가스: 'c', 등유: 'd', 전기: 'e',
  알코올: 'f', 태양열: 'i', CNG: 'j', 압축천연가스: 'j', LNG: 'k',
  하이브리드: 'l', 수소: 'q',
};

function pick(
  codes: Record<string, Row>,
  names: Record<string, string>,
  code: string | null,
  name: string | null,
  locale: string
): string | null {
  const key = code?.trim();
  const row = (key && codes[key]) || (name && codes[names[name.trim()]]);
  // Кода нет в таблицах и названия тоже: лучше корейское слово, чем прочерк.
  if (!row) return name?.trim() || null;
  return row[locale as VinTextLocale] ?? row.en;
}

export const colorTerm = (code: string | null, name: string | null, locale: string) =>
  pick(COLOR_CODES, COLOR_NAMES, code, name, locale);

export const fuelTerm = (code: string | null, name: string | null, locale: string) =>
  pick(FUEL_CODES, FUEL_NAMES, code, name, locale);

/** Для теста полноты. */
export const REGISTRY_TABLES = { COLOR_CODES, FUEL_CODES };
export const REGISTRY_NAME_ALIASES = { COLOR_NAMES, FUEL_NAMES };
