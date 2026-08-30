import 'server-only';
import { registryDate, registryNumber, registryText } from './registry-fields';

/**
 * Внешние источники по VIN: реестр США (NHTSA) и корейский госпортал car365.
 *
 * Оба необязательны и оба обязаны уметь молчать. Локальный разбор (`decode.ts`)
 * отвечает всегда и сам по себе, а эти двое ходят по сети к чужим службам, которые
 * лежат, тормозят и меняют разметку без предупреждения. Поэтому здесь нет ни одного
 * `throw` наружу: каждая функция возвращает результат либо причину отказа, а роут
 * складывает то, что доехало.
 *
 * Отсюда же таймаут. Без него запрос висит до таймаута платформы, и страница проверки
 * выглядит сломанной, хотя сломан чужой сервер.
 */

const TIMEOUT_MS = 8000;

/**
 * Потолок на тело ответа. Страница портала весит ~200 КБ, ответ NHTSA ~10 КБ,
 * так что два мегабайта — это запас в десять раз. Без потолка сломавшийся или
 * враждебный сервер способен лить в нас поток, пока не кончится память процесса.
 */
const MAX_BYTES = 2_000_000;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';

type Fetched = { ok: boolean; status: number; text: string; headers: Headers };

/**
 * Запрос с таймаутом **на весь обмен, включая чтение тела**.
 *
 * Это не придирка. Прежняя версия снимала таймер, как только приходили заголовки,
 * и `await response.text()` дальше не был ограничен ничем: сервер, который отдал
 * заголовки и замолчал, подвешивал наш запрос до таймаута платформы. Контроллер
 * теперь живёт до конца чтения, поэтому обрыв на теле обрабатывается так же,
 * как обрыв на соединении.
 */
async function fetchText(url: string, init: RequestInit = {}): Promise<Fetched> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
    return {
      ok: response.ok,
      status: response.status,
      headers: response.headers,
      text: await readCapped(response),
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Чтение тела с потолком: поток режется, а не копится в памяти целиком. */
async function readCapped(response: Response): Promise<string> {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BYTES) {
    await response.body?.cancel();
    return '';
  }

  const reader = response.body?.getReader();
  if (!reader) return '';

  const decoder = new TextDecoder();
  let out = '';
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      break;
    }
    out += decoder.decode(value, { stream: true });
  }
  return out + decoder.decode();
}

/**
 * Куки одной строкой. `get('set-cookie')` в Node склеивает несколько кук запятой
 * и портит их, поэтому основной путь — `getSetCookie()`. Он появился в Node 18.14;
 * на рантайме постарше метода нет, и без запасной ветки это `TypeError`, который
 * выглядел бы как «портал недоступен».
 */
function cookieJar(headers: Headers): string {
  const list = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : [];
  if (list.length) return list.map((cookie) => cookie.split(';')[0]).join('; ');
  const single = headers.get('set-cookie');
  return single ? single.split(';')[0] : '';
}

/** Сообщение об ошибке из чего угодно: бросить можно не только `Error`. */
function reason(error: unknown): string {
  if (error instanceof Error) return error.name === 'AbortError' ? 'timeout' : error.message;
  return String(error);
}

/* ------------------------------------------------------------------ NHTSA */

/**
 * Что берём из ответа NHTSA. Полей там 154, но осмысленно заполнены единицы:
 * это база рынка США, и по корейскому «домашнему» VIN она чаще всего знает только
 * страну завода. Замер 30.08.2026 по трём номерам: модели, кузова и топлива
 * не вернулось ни у одного, марка — у двух из трёх.
 *
 * Поэтому источник и стоит вторым: он уточняет, а не отвечает.
 */
export type NhtsaFacts = Partial<
  Record<
    | 'make'
    | 'model'
    | 'series'
    | 'trim'
    | 'vehicleType'
    | 'bodyClass'
    | 'fuel'
    | 'displacementL'
    | 'cylinders'
    | 'driveType'
    | 'transmission'
    | 'doors'
    | 'plantCountry'
    | 'plantCity'
    | 'manufacturer',
    string
  >
> & { year: number | null };

const NHTSA_FIELDS: Array<[keyof NhtsaFacts, string]> = [
  ['make', 'Make'],
  ['model', 'Model'],
  ['series', 'Series'],
  ['trim', 'Trim'],
  ['vehicleType', 'VehicleType'],
  ['bodyClass', 'BodyClass'],
  ['fuel', 'FuelTypePrimary'],
  ['displacementL', 'DisplacementL'],
  ['cylinders', 'EngineCylinders'],
  ['driveType', 'DriveType'],
  ['transmission', 'TransmissionStyle'],
  ['doors', 'Doors'],
  ['plantCountry', 'PlantCountry'],
  ['plantCity', 'PlantCity'],
  ['manufacturer', 'Manufacturer'],
];

/**
 * Разбор у NHTSA. `null` — служба не ответила либо не знает ничего.
 *
 * Год из ответа не выбрасываем, но и не подменяем им локальный: они расходятся.
 * NHTSA разводит тридцатилетний цикл по знаку 7 (правило FMVSS 565, американское),
 * и на корейских номерах это даёт промах на тридцать лет — по `KMHLR41JGPU041935`
 * она отвечает 1993 против нашего 2023. Решает расхождение роут, а не этот модуль.
 */
export async function fromNhtsa(vin: string): Promise<NhtsaFacts | null> {
  try {
    const response = await fetchText(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`,
      { headers: { Accept: 'application/json' } }
    );
    if (!response.ok || !response.text) return null;

    let payload: { Results?: unknown };
    try {
      payload = JSON.parse(response.text) as { Results?: unknown };
    } catch {
      // Прокси отдал HTML вместо JSON — это не повод ронять всю проверку.
      return null;
    }

    const results = payload?.Results;
    const row = Array.isArray(results) ? results[0] : null;
    if (!row || typeof row !== 'object') return null;

    const facts: NhtsaFacts = { year: null };
    for (const [key, field] of NHTSA_FIELDS) {
      const value = (row as Record<string, unknown>)[field];
      // Пустая строка у NHTSA означает «не знаю», и класть её в ответ нельзя:
      // на витрине она читается как настоящий, но пустой факт.
      if (typeof value === 'string' && value.trim()) {
        (facts as Record<string, unknown>)[key] = value.trim();
      }
    }

    const year = Number((row as Record<string, unknown>).ModelYear);
    facts.year = Number.isInteger(year) && year > 1900 ? year : null;

    // Кроме года не осталось ничего — значит служба не узнала машину.
    return Object.keys(facts).length > 1 || facts.year ? facts : null;
  } catch (error) {
    console.warn('[vin] NHTSA недоступна:', reason(error));
    return null;
  }
}

/* ---------------------------------------------------------------- car365 */

/** Снята ли машина с учёта на экспорт — и что о ней записано в корейском реестре. */
export type Car365Facts = {
  name: string | null;
  /**
   * Цвет и топливо приходят парой «код + корейское название». Показываем по коду:
   * портал публикует полные таблицы (`colorArray`, `fuelArray`), и они закрытые.
   * Название остаётся запасным путём и переводится на границе показа, не здесь.
   */
  colorCode: string | null;
  colorName: string | null;
  fuelCode: string | null;
  fuelName: string | null;
  mileageKm: number | null;
  displacementCc: number | null;
  seats: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  firstRegistered: string | null;
  /** Дата отметки о вывозе. Пустая при снятии с учёта, но ещё не вывезенной машине. */
  exportDeclared: string | null;
};

export type Car365Result =
  | { status: 'found'; facts: Car365Facts }
  /** Реестр ответил, но записи нет: машина с учёта на экспорт не снималась. */
  | { status: 'not-found' }
  /** До реестра не достучались либо он сменил разметку. Это не факт о машине. */
  | { status: 'unavailable'; reason: string };

const CAR365_VIEW = 'https://www.car365.go.kr/ccpt/carlife/scrcar/schdcarXportView.do';
const CAR365_LIST = 'https://www.car365.go.kr/ccpt/carlife/scrcar/selectSchdcarXportList.do';

const str = (row: Record<string, unknown>, key: string) => registryText(row[key]);
const num = (row: Record<string, unknown>, key: string) => registryNumber(row[key]);
const ymd = (row: Record<string, unknown>, key: string) => registryDate(row[key]);

/**
 * Запись в реестре снятых с учёта на экспорт.
 *
 * Открытого API у портала нет, поэтому повторяем тот запрос, который делает сама
 * страница. Разобран он по её же коду, а не подобран, и из разбора следуют три вещи,
 * каждая обязательная:
 *
 * 1. **Заголовок `X-AJAX-REQ: CCPT`.** Портал вешает его на все свои запросы через
 *    `$.ajaxSetup` в `prtl.ajax.js`, поэтому в коде страницы его не видно — там просто
 *    `$.ajax({data: {vin}})`. Без него ответ приходит пустым, и это выглядит как
 *    «машина не найдена». Ровно на этом стоял прежний черновик.
 * 2. **Тело — форма, а не JSON.** Страница зовёт голый `$.ajax` без `contentType`,
 *    то есть `application/x-www-form-urlencoded` с единственным полем `vin`.
 * 3. **Пустой ответ — это «не найдено», а не сбой.** Сама страница проверяет
 *    `if (!result || result.length === 0)` и показывает «записей нет». Различать эти
 *    два случая обязательно: «не снята с учёта» — факт о машине, «реестр не ответил» —
 *    факт о нас, и покупателю их путать нельзя.
 *
 * Путь хрупкий по устройству: он держится на регулярке по чужому HTML и на заголовке,
 * который нигде не описан. Сломается — молча, поэтому `unavailable` и говорит, где.
 */
export async function fromCar365(vin: string): Promise<Car365Result> {
  try {
    const view = await fetchText(CAR365_VIEW, {
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*;q=0.8' },
    });
    if (!view.ok) return { status: 'unavailable', reason: `view ${view.status}` };

    const token = view.text.match(/_CSRF_TOKEN\s*=\s*["']([^"']+)["']/)?.[1];
    if (!token) return { status: 'unavailable', reason: 'csrf-token-not-found' };

    const jar = cookieJar(view.headers);

    const list = await fetchText(CAR365_LIST, {
      method: 'POST',
      headers: {
        'User-Agent': UA,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Accept: 'application/json, text/javascript, */*; q=0.01',
        Cookie: jar,
        'X-CSRF-TOKEN': token,
        'X-AJAX-REQ': 'CCPT',
        'X-Requested-With': 'XMLHttpRequest',
        Origin: 'https://www.car365.go.kr',
        Referer: CAR365_VIEW,
      },
      body: `vin=${encodeURIComponent(vin)}`,
    });
    if (!list.ok) return { status: 'unavailable', reason: `list ${list.status}` };

    const text = list.text.trim();
    if (!text) return { status: 'not-found' };

    let rows: unknown;
    try {
      rows = JSON.parse(text);
    } catch {
      return { status: 'unavailable', reason: 'json-parse-failed' };
    }

    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row || typeof row !== 'object') return { status: 'not-found' };

    const record = row as Record<string, unknown>;
    return {
      status: 'found',
      facts: {
        name: str(record, 'atmbNm'),
        colorCode: str(record, 'colorCd'),
        colorName: str(record, 'colorNm'),
        fuelCode: str(record, 'useFuelCd'),
        fuelName: str(record, 'useFuelNm'),
        mileageKm: num(record, 'drvngDstnc'),
        displacementCc: num(record, 'dsplvl'),
        seats: num(record, 'rdcpctCnt'),
        lengthMm: num(record, 'length'),
        widthMm: num(record, 'width'),
        heightMm: num(record, 'height'),
        firstRegistered: ymd(record, 'frstRegYmd'),
        exportDeclared: ymd(record, 'xportFlflYnDclrYmd'),
      },
    };
  } catch (error) {
    console.warn('[vin] car365 недоступен:', reason(error));
    return { status: 'unavailable', reason: 'request-failed' };
  }
}
