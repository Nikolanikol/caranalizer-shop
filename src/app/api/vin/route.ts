import { NextResponse } from 'next/server';
import { decodeVin, normalizeVin, vinProblem, type VinInfo, type VinProblem } from '@/lib/vin/decode';
import { fromCar365, fromNhtsa, type Car365Result, type NhtsaFacts } from '@/lib/vin/sources';
import { userFromRequest } from '@/lib/auth/server';
import { readQuota, recordLookup, VIN_DAILY_LIMIT, type VinQuota } from '@/lib/vin/quota';

/**
 * Разбор VIN. Базовая часть открыта всем, расширенная — вошедшим.
 *
 * Гейт стоит здесь, а не в разметке страницы, и иначе быть не может: сессия живёт
 * в localStorage браузера, токен приходит заголовком, и «спрятать» блок версткой
 * значит не спрятать ничего — данные всё равно уехали бы в ответе.
 *
 * Отсюда же порядок: не вошёл — во внешние службы не ходим вовсе. Это не только
 * про доступ, но и про нагрузку: два сетевых запроса к чужим серверам на каждого
 * анонимного посетителя мы дарить не обязаны.
 *
 * Базовый разбор при этом роут почти никогда не считает: страница декодирует номер
 * прямо в браузере тем же модулем и показывает марку, страну и год мгновенно.
 * Здесь он повторяется, чтобы ответ был самодостаточным.
 */

/*
 * Принимаем только полный VIN из 17 знаков.
 *
 * Портал car365 берёт и короткие номера кузова (от 11), но локально такой номер
 * не разбирается, а форма его и не отправит — кнопка включается на семнадцатом знаке.
 * Расширять — вместе с формой и с тем, что показывать вместо марки и года.
 */

type VinResponse = {
  vin: string;
  basic: VinInfo | null;
  /** true — расширенная часть не запрашивалась: посетитель не вошёл. */
  locked: boolean;
  nhtsa?: NhtsaFacts | null;
  car365?: Car365Result;
  /** Сколько проверок израсходовано. Приезжает с сервера, чтобы цифра была честной. */
  quota?: VinQuota;
};

/** Ответ на негодный номер. Причина называется — иначе форму не починить. */
const PROBLEMS: Record<VinProblem, string> = {
  length: 'VIN состоит из 17 знаков',
  charset: 'В VIN не бывает букв I, O и Q — сверьте с табличкой',
  region: 'Первый знак VIN не может быть нулём',
  year: 'Десятый знак VIN — код года выпуска, здесь он неверный',
};

export async function POST(request: Request) {
  /*
   * `JSON.parse` успешно разбирает `null`, `5` и `"строку"` — тело валидно как JSON,
   * но объектом не является. Обращение `body.vin` к `null` роняло роут пятисоткой
   * с пустым телом: поймано фаззингом 30.08.2026, глазами такое не видно.
   */
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const body: { vin?: unknown } =
    parsed && typeof parsed === 'object' ? (parsed as { vin?: unknown }) : {};

  const vin = normalizeVin(typeof body.vin === 'string' ? body.vin : '');

  /*
   * Проверка та же, что в форме (`vinProblem` из `lib/vin/decode`), и это не дубль:
   * форма бережёт запрос, а здесь — единственная настоящая проверка, потому что тело
   * запроса подделывается. Правила при этом физически одни, разъехаться им негде.
   */
  const problem = vinProblem(vin);
  if (problem) {
    return NextResponse.json({ error: PROBLEMS[problem], problem }, { status: 400 });
  }

  // Полный VIN — семнадцать знаков; короткий номер кузова локально не разбирается.
  // Функция чистая и не бросает — базовый разбор доедет до посетителя всегда.
  const basic = decodeVin(vin);

  /*
   * Отказ проверки токена приравнивается к «не вошёл», а не к ошибке.
   *
   * `userFromRequest` ходит по сети в GoTrue, и это второй сетевой вызов в роуте:
   * упасть он может от чего угодно — от недоступного GoTrue до незаданной переменной
   * окружения. Прежде такой отказ давал 500 и уносил с собой даже базовый разбор,
   * который вообще не зависит ни от какой сети.
   *
   * Закрываемся, а не открываемся: сомнение трактуем как «не вошёл».
   */
  let user: Awaited<ReturnType<typeof userFromRequest>> = null;
  try {
    user = await userFromRequest(request);
  } catch (error) {
    console.warn('[/api/vin] проверка токена не удалась:', error);
  }

  if (!user) {
    const locked: VinResponse = { vin, basic, locked: true };
    return NextResponse.json(locked);
  }

  /*
   * Лимит проверяется до похода наружу: смысл его в том, чтобы не ходить.
   *
   * Гонка здесь возможна — два одновременных запроса пройдут оба, — и это принято
   * сознательно: атомарный счётчик потребовал бы RPC с блокировкой, а цена ошибки
   * при лимите в пять штук равна одной лишней проверке.
   */
  const quota = await readQuota(user.id);
  if (quota.used >= VIN_DAILY_LIMIT) {
    return NextResponse.json(
      { error: 'На сегодня проверки закончились', quota, vin, basic, locked: false },
      { status: 429 }
    );
  }

  /*
   * Обе службы опрашиваются разом, а не по очереди: последовательно это до шестнадцати
   * секунд ожидания на паре таймаутов.
   *
   * `allSettled`, а не `all`, хотя обе функции свои отказы уже проглатывают: `all`
   * роняет весь роут от одного неожиданного отказа, и посетитель теряет в том числе
   * базовый разбор. Страховка стоит одной строки, а стоимость ошибки — весь ответ.
   */
  const [nhtsaOutcome, car365Outcome] = await Promise.allSettled([
    fromNhtsa(vin),
    fromCar365(vin),
  ]);

  if (nhtsaOutcome.status === 'rejected') console.error('[/api/vin] NHTSA:', nhtsaOutcome.reason);
  if (car365Outcome.status === 'rejected') console.error('[/api/vin] car365:', car365Outcome.reason);

  const car365 =
    car365Outcome.status === 'fulfilled'
      ? car365Outcome.value
      : ({ status: 'unavailable', reason: 'internal-error' } as Car365Result);

  // Записываем состоявшуюся проверку — она и есть единица лимита. Ответа не ждём
  // молча: отказ записи логируется внутри и на ответ посетителю не влияет.
  await recordLookup(user.id, vin, car365.status);

  const full: VinResponse = {
    vin,
    basic,
    locked: false,
    nhtsa: nhtsaOutcome.status === 'fulfilled' ? nhtsaOutcome.value : null,
    car365,
    quota: { ...quota, used: quota.used + 1 },
  };
  return NextResponse.json(full);
}
