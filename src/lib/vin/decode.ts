/**
 * Разбор VIN: производитель, страна сборки и модельный год.
 *
 * Считается по самому номеру, без обращения к внешним службам, — то есть отвечает
 * всегда и мгновенно. Это не замена проверке по базам, а первый слой: марку и год
 * видно сразу, а справки из Car365 и NHTSA приезжают отдельно и могут не приехать вовсе.
 *
 * Модуль самодостаточен намеренно: без относительных импортов его напрямую тянет
 * `node --experimental-strip-types` в тестах — тот же приём, что у `partsfit:terms`.
 * Копию таблицы в тест не переписывать: она разойдётся с оригиналом в первый же месяц.
 *
 * Данных о модели, кузове и двигателе тут нет и быть не может: VDS (знаки 4–8) каждый
 * завод кодирует по-своему и таблиц не публикует. Всё, что достаётся из номера
 * без чужой базы, — это WMI и год.
 */

/** Что удалось вычитать из номера. `null` — значит не знаем, а не «неизвестно». */
export type VinInfo = {
  /** Нормализованный номер: заглавные, без разделителей. */
  vin: string;
  /** Первые три знака — код завода-изготовителя. */
  wmi: string;
  make: string | null;
  country: string | null;
  year: number | null;
};

/**
 * WMI → завод и страна. Список неполный и полным не будет: кодов больше двадцати тысяч,
 * а официальный реестр SAE платный. Здесь — Корея (наш рынок), Япония, Европа и США,
 * то есть то, что реально приезжает на разбор.
 *
 * Двухзначные ключи не опечатка: у части американских заводов совпадает только начало,
 * и поиск ниже сначала пробует три знака, потом два.
 *
 * Корейская марка — не то же самое, что корейская сборка, и пропуск здесь стоил
 * пустой карточки живому посетителю. 31.08.2026 человек ввёл `5XXGT4L31LG441304` —
 * Kia Optima с завода в Джорджии — и не увидел ни марки, ни страны: кодов заводов
 * Hyundai и Kia вне Кореи в таблице не было вовсе, хотя это ровно наша аудитория.
 * Добавлены `5XX`/`5XY` (Kia Georgia), `5NP`/`5NM` (Hyundai Alabama), `3KM`/`3KP`
 * (Kia Mexico) и недостающие корейские `KMF`, `KMT`, `KMU`, `KPH`, `KL1`, `KL8`.
 *
 * Такая машина при этом никогда не найдётся в корейском реестре экспорта — она
 * из Кореи не вывозилась. Это факт о машине, а не наш сбой, и путать их нельзя.
 *
 * Коды сверены со справочником NHTSA (`vpic.nhtsa.dot.gov/api/vehicles/DecodeWMI/<код>`),
 * а не выписаны по памяти: в поле `make` лежит то, что увидит покупатель, и марка
 * невпопад хуже пустого места. Тем же запросом проверять и следующее пополнение.
 */
const WMI: Record<string, { make: string; country: string }> = {
  // Корея
  KM8: { make: 'Hyundai', country: 'South Korea' },
  KMH: { make: 'Hyundai', country: 'South Korea' },
  KMA: { make: 'Genesis', country: 'South Korea' },
  KNA: { make: 'Kia', country: 'South Korea' },
  KNC: { make: 'Kia', country: 'South Korea' },
  KND: { make: 'Kia', country: 'South Korea' },
  KLA: { make: 'Daewoo / GM Korea', country: 'South Korea' },
  KPA: { make: 'SsangYong (KG Mobility)', country: 'South Korea' },
  KPT: { make: 'SsangYong (KG Mobility)', country: 'South Korea' },
  KNM: { make: 'Renault Samsung', country: 'South Korea' },
  KMF: { make: 'Hyundai', country: 'South Korea' },
  KMT: { make: 'Hyundai', country: 'South Korea' },
  KMU: { make: 'Hyundai', country: 'South Korea' },
  KPH: { make: 'Hyundai', country: 'South Korea' },
  KL1: { make: 'Chevrolet / GM Korea', country: 'South Korea' },
  KL8: { make: 'Chevrolet / GM Korea', country: 'South Korea' },
  // Германия и остальная Европа
  WAU: { make: 'Audi', country: 'Germany' },
  WBA: { make: 'BMW', country: 'Germany' },
  WBS: { make: 'BMW M', country: 'Germany' },
  WDB: { make: 'Mercedes-Benz', country: 'Germany' },
  WDC: { make: 'Mercedes-Benz', country: 'Germany' },
  WDD: { make: 'Mercedes-Benz', country: 'Germany' },
  WME: { make: 'Smart', country: 'Germany' },
  WMX: { make: 'Mercedes-AMG', country: 'Germany' },
  WVG: { make: 'Volkswagen', country: 'Germany' },
  WVW: { make: 'Volkswagen', country: 'Germany' },
  WP0: { make: 'Porsche', country: 'Germany' },
  VSS: { make: 'SEAT', country: 'Spain' },
  VSX: { make: 'SEAT', country: 'Spain' },
  VSE: { make: 'SEAT', country: 'Spain' },
  VWV: { make: 'Volkswagen', country: 'Spain' },
  SAJ: { make: 'Jaguar', country: 'UK' },
  SAL: { make: 'Land Rover', country: 'UK' },
  SCA: { make: 'Rolls-Royce', country: 'UK' },
  SCC: { make: 'Lotus', country: 'UK' },
  SCE: { make: 'DeLorean', country: 'UK' },
  SCF: { make: 'Aston Martin', country: 'UK' },
  SDB: { make: 'Peugeot', country: 'UK' },
  SFD: { make: 'Alexander Dennis', country: 'UK' },
  SHS: { make: 'Honda', country: 'UK' },
  SJN: { make: 'Nissan', country: 'UK' },
  SKF: { make: 'Vauxhall', country: 'UK' },
  SNT: { make: 'Honda', country: 'UK' },
  SU9: { make: 'Solaris Bus', country: 'Poland' },
  TMB: { make: 'Škoda', country: 'Czech Republic' },
  TMC: { make: 'Hyundai', country: 'Czech Republic' },
  U5Y: { make: 'Kia', country: 'Slovakia' },
  U6Y: { make: 'Kia', country: 'Slovakia' },
  VLU: { make: 'Scania', country: 'Sweden' },
  YK1: { make: 'Saab', country: 'Finland' },
  YS3: { make: 'Saab', country: 'Sweden' },
  YV1: { make: 'Volvo', country: 'Sweden' },
  YV4: { make: 'Volvo', country: 'Sweden' },
  ZAR: { make: 'Alfa Romeo', country: 'Italy' },
  ZCF: { make: 'Iveco', country: 'Italy' },
  ZFA: { make: 'Fiat', country: 'Italy' },
  ZFF: { make: 'Ferrari', country: 'Italy' },
  ZHW: { make: 'Lamborghini', country: 'Italy' },
  ZLA: { make: 'Lancia', country: 'Italy' },
  ZAM: { make: 'Maserati', country: 'Italy' },
  ZAP: { make: 'Piaggio', country: 'Italy' },
  // Япония
  JHM: { make: 'Honda', country: 'Japan' },
  JHL: { make: 'Honda', country: 'Japan' },
  JT1: { make: 'Toyota', country: 'Japan' },
  JT2: { make: 'Toyota', country: 'Japan' },
  JT3: { make: 'Toyota', country: 'Japan' },
  JT4: { make: 'Toyota', country: 'Japan' },
  JT5: { make: 'Toyota', country: 'Japan' },
  JT6: { make: 'Toyota', country: 'Japan' },
  JT8: { make: 'Toyota', country: 'Japan' },
  JTD: { make: 'Toyota', country: 'Japan' },
  JTE: { make: 'Toyota', country: 'Japan' },
  JTH: { make: 'Lexus', country: 'Japan' },
  JTJ: { make: 'Lexus', country: 'Japan' },
  JN1: { make: 'Nissan', country: 'Japan' },
  JN8: { make: 'Nissan', country: 'Japan' },
  JNK: { make: 'Infiniti', country: 'Japan' },
  JNR: { make: 'Infiniti', country: 'Japan' },
  JNX: { make: 'Infiniti', country: 'Japan' },
  JM1: { make: 'Mazda', country: 'Japan' },
  JM3: { make: 'Mazda', country: 'Japan' },
  JF1: { make: 'Subaru', country: 'Japan' },
  JF2: { make: 'Subaru', country: 'Japan' },
  JS1: { make: 'Suzuki', country: 'Japan' },
  JS2: { make: 'Suzuki', country: 'Japan' },
  JS3: { make: 'Suzuki', country: 'Japan' },
  JS4: { make: 'Suzuki', country: 'Japan' },
  JC1: { make: 'Fiat Auto', country: 'Japan' },
  JR2: { make: 'Isuzu', country: 'Japan' },
  // Северная Америка
  '1C3': { make: 'Chrysler', country: 'USA' },
  '1C4': { make: 'Chrysler', country: 'USA' },
  '1C6': { make: 'Chrysler', country: 'USA' },
  '1F1': { make: 'Ford', country: 'USA' },
  '1F2': { make: 'Ford', country: 'USA' },
  '1F3': { make: 'Ford', country: 'USA' },
  '1F4': { make: 'Ford', country: 'USA' },
  '1F5': { make: 'Ford', country: 'USA' },
  '1F6': { make: 'Ford', country: 'USA' },
  '1FA': { make: 'Ford', country: 'USA' },
  '1FB': { make: 'Ford', country: 'USA' },
  '1FC': { make: 'Ford', country: 'USA' },
  '1FD': { make: 'Ford', country: 'USA' },
  '1FM': { make: 'Ford', country: 'USA' },
  '1FT': { make: 'Ford', country: 'USA' },
  '1G1': { make: 'Chevrolet', country: 'USA' },
  '1G2': { make: 'Pontiac', country: 'USA' },
  '1G3': { make: 'Oldsmobile', country: 'USA' },
  '1G4': { make: 'Buick', country: 'USA' },
  '1G6': { make: 'Cadillac', country: 'USA' },
  '1G8': { make: 'Saturn', country: 'USA' },
  '1GC': { make: 'Chevrolet Truck', country: 'USA' },
  '1GM': { make: 'Pontiac', country: 'USA' },
  '1GT': { make: 'GMC Truck', country: 'USA' },
  '1J4': { make: 'Jeep', country: 'USA' },
  '1J8': { make: 'Jeep', country: 'USA' },
  '1T8': { make: 'Thomas', country: 'USA' },
  '1YV': { make: 'Mazda', country: 'USA' },
  '1ZV': { make: 'Ford', country: 'USA' },
  '2FA': { make: 'Ford', country: 'Canada' },
  '2FB': { make: 'Ford', country: 'Canada' },
  '2FC': { make: 'Ford', country: 'Canada' },
  '2FM': { make: 'Ford', country: 'Canada' },
  '2FT': { make: 'Ford', country: 'Canada' },
  '3FA': { make: 'Ford', country: 'Mexico' },
  '3KM': { make: 'Kia', country: 'Mexico' },
  '3KP': { make: 'Kia', country: 'Mexico' },
  '4F2': { make: 'Mazda', country: 'USA' },
  '4F4': { make: 'Mazda', country: 'USA' },
  '4S3': { make: 'Subaru', country: 'USA' },
  '4S4': { make: 'Subaru', country: 'USA' },
  '4T1': { make: 'Toyota', country: 'USA' },
  '4T3': { make: 'Toyota', country: 'USA' },
  '4T4': { make: 'Toyota', country: 'USA' },
  '4US': { make: 'BMW', country: 'USA' },
  '5F': { make: 'Honda', country: 'USA' },
  '5J6': { make: 'Honda', country: 'USA' },
  '5L': { make: 'Lincoln', country: 'USA' },
  '5N1': { make: 'Nissan', country: 'USA' },
  '5NM': { make: 'Hyundai', country: 'USA' },
  '5NP': { make: 'Hyundai', country: 'USA' },
  '5T1': { make: 'Toyota', country: 'USA' },
  '5XX': { make: 'Kia', country: 'USA' },
  '5XY': { make: 'Kia', country: 'USA' },
  '5Y2': { make: 'Pontiac', country: 'USA' },
};

/**
 * Страны из таблицы выше, без повторов. Отсюда их берёт словарь подписей
 * (`countries.ts`), и оттуда же тест проверяет, что непереведённых не осталось:
 * новый WMI с новой страной иначе молча уехал бы на витрину по-английски.
 */
export const VIN_COUNTRIES: readonly string[] = [
  ...new Set(Object.values(WMI).map((entry) => entry.country)),
].sort();

/**
 * Привести номер к виду, в котором его можно разбирать: заглавные, без пробелов,
 * дефисов и прочих разделителей. Знаки не подменяются — что пришло, то и разбираем.
 */
export function normalizeVin(raw: string): string {
  // Проверка типа не формальность: функция экспортируется, и на вход ей однажды
  // прилетит `undefined` из чужого кода — `undefined.toUpperCase()` уронит страницу.
  if (typeof raw !== 'string') return '';
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * То же, но для поля ввода: I, O и Q в VIN не встречаются вовсе, и человек, который
 * переписывает номер с таблички, почти наверняка увидел там 1 и 0. Подмена — удобство
 * набора, поэтому она живёт отдельно от `normalizeVin`: разбирать чужую строку с такой
 * заменой нельзя, а править набранное руками — можно.
 */
export function sanitizeVinInput(raw: string): string {
  return normalizeVin(raw).replace(/I/g, '1').replace(/[OQ]/g, '0').slice(0, VIN_LENGTH);
}

/**
 * Коды модельного года, знак 10. Тридцатилетний цикл: I, O, Q, U, Z и ноль в нём
 * не участвуют — их путают с единицей, нулём и двойкой.
 */
const YEAR_CODES = 'ABCDEFGHJKLMNPRSTVWXY123456789';

/** Начало цикла: 1980 = A. Дальше он повторяется каждые тридцать лет. */
const YEAR_EPOCH = 1980;

export const VIN_LENGTH = 17;

/**
 * Что не так с номером. `null` — всё в порядке, можно отправлять.
 *
 * Проверка одна на браузер и на сервер: форма и роут зовут эту же функцию, поэтому
 * правила не могут разъехаться. Клиентская проверка бережёт запрос, серверная —
 * единственная настоящая: тело запроса подделывается.
 *
 * **Контрольный разряд (знак 9) не проверяем, и это решение, а не упущение.** Он
 * обязателен только в Северной Америке; у корейских «домашних» номеров не сходится
 * штатно, и предупреждение «похоже на опечатку» срабатывало бы как раз на нашем
 * основном рынке. Проверено на живых номерах: у всех трёх тестовых NHTSA пишет
 * «check digit does not calculate properly», и все три — настоящие.
 */
export type VinProblem = 'length' | 'charset' | 'region' | 'year';

/** Полный алфавит VIN: латиница без I, O и Q плюс цифры. */
const VIN_ALPHABET = /^[A-HJ-NPR-Z0-9]+$/;

/**
 * Первый знак — регион завода: 1–5 Северная Америка, 6–7 Океания, 8–9 Южная Америка,
 * A–H Африка, J–R Азия, S–Z Европа. Ноль не назначен никому, и номер, начинающийся
 * с него, заведомо не VIN.
 */
const VIN_REGION = /^[A-HJ-NPR-Z1-9]/;

export function vinProblem(raw: string): VinProblem | null {
  const vin = normalizeVin(raw);
  if (vin.length !== VIN_LENGTH) return 'length';
  if (!VIN_ALPHABET.test(vin)) return 'charset';
  if (!VIN_REGION.test(vin)) return 'region';
  // Знак 10 — код модельного года. Вне таблицы кодов это не номер, а набор букв.
  if (!YEAR_CODES.includes(vin.charAt(9))) return 'year';
  return null;
}

/**
 * Модельный год по знаку 10.
 *
 * Цикл тридцатилетний, поэтому один и тот же знак означает и 1993-й, и 2023-й. Развести
 * их нечем: правило «знак 7 буквенный — значит 2010+» действует только в Северной Америке
 * (FMVSS 565), а у нас корейские и европейские машины, где знак 7 к году отношения
 * не имеет. Проверено на живых номерах: у Hyundai `KMHLR41JGPU041935` и у VW
 * `WVGZZZ5NZLW352686` знак 7 цифровой, а машины 2023 и 2020 годов.
 *
 * Поэтому берём самый поздний год цикла, который ещё не в будущем. Запас в один год —
 * это модельный год: машину 2027 модельного года продают с осени 2026-го.
 */
function decodeYear(char: string, currentYear: number): number | null {
  const index = YEAR_CODES.indexOf(char);
  if (index === -1) return null;

  let year = YEAR_EPOCH + index;
  /*
   * Верхняя граница — не перестраховка, а защита от вечного цикла: при `currentYear`,
   * равном Infinity (испорченная дата в аргументе), условие не перестало бы выполняться
   * никогда, и запрос повис бы намертво. NaN сюда не доходит — сравнение с ним ложно.
   */
  const ceiling = Number.isFinite(currentYear) ? currentYear + 1 : YEAR_EPOCH;
  while (year + YEAR_CODES.length <= ceiling) year += YEAR_CODES.length;
  return year;
}

/** Завод по WMI: сначала три знака, потом два — часть заводов различима только началом. */
function decodeWmi(wmi: string) {
  return WMI[wmi] ?? WMI[wmi.slice(0, 2)] ?? null;
}

/**
 * Разобрать номер. `null` — номер не той длины, разбирать нечего.
 *
 * `now` передаётся ради тестов и предсказуемости: год «самый поздний из непрошедших»
 * зависит от сегодняшней даты, и без параметра тест начал бы врать при смене года.
 */
export function decodeVin(raw: string, now: Date = new Date()): VinInfo | null {
  const vin = normalizeVin(raw);
  if (vin.length !== VIN_LENGTH) return null;

  // Невалидная дата даёт NaN — год тогда просто не определяется, а не считается неверно.
  const currentYear = now instanceof Date ? now.getFullYear() : new Date().getFullYear();

  const wmi = vin.slice(0, 3);
  const maker = decodeWmi(wmi);

  return {
    vin,
    wmi,
    make: maker?.make ?? null,
    country: maker?.country ?? null,
    year: decodeYear(vin.charAt(9), currentYear),
  };
}
