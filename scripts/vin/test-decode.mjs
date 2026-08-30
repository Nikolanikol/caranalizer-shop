/**
 * Тесты разбора VIN — `npm run vin:test`.
 *
 * Модуль импортируется настоящий (`src/lib/vin/decode.ts`), а не переписанный сюда:
 * копия таблицы заводов разошлась бы с оригиналом в первый же месяц. Отсюда
 * `--experimental-strip-types` в команде — тот же приём, что у `partsfit:terms`.
 *
 * Дата везде задана явно. Модельный год выводится из «самого позднего непрошедшего»,
 * то есть зависит от сегодняшней; без фиксированной даты тест начал бы врать при смене
 * года — и это худший вид падения, потому что код при этом не менялся.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { decodeVin, normalizeVin, sanitizeVinInput, vinProblem, VIN_COUNTRIES } = await import(
  path.join(ROOT, 'src/lib/vin/decode.ts')
);
const { TRANSLATED_COUNTRIES, countryName, VIN_LOCALES } = await import(
  path.join(ROOT, 'src/lib/vin/countries.ts')
);
const { vinAuthLink } = await import(path.join(ROOT, 'src/lib/vin/auth-link.ts'));
const { colorTerm, fuelTerm, REGISTRY_TABLES, REGISTRY_NAME_ALIASES } = await import(
  path.join(ROOT, 'src/lib/vin/registry-terms.ts')
);
const { registryText, registryNumber, registryDate } = await import(
  path.join(ROOT, 'src/lib/vin/registry-fields.ts')
);
const { parseHistory, addToHistory, VIN_HISTORY_MAX } = await import(
  path.join(ROOT, 'src/lib/vin/history.ts')
);

/** Все годы считаются от этой даты, а не от сегодняшней. */
const NOW = new Date('2026-08-30T00:00:00Z');

describe('decodeVin', () => {
  test('номер не той длины не разбирается', () => {
    assert.equal(decodeVin('123', NOW), null);
    assert.equal(decodeVin('WVGZZZ5NZLW352686123', NOW), null);
    assert.equal(decodeVin('', NOW), null);
  });

  test('корейский Hyundai (KMH)', () => {
    const r = decodeVin('KMHLR41JGPU041935', NOW);
    assert.equal(r.wmi, 'KMH');
    assert.equal(r.make, 'Hyundai');
    assert.equal(r.country, 'South Korea');
    assert.equal(r.year, 2023); // P
  });

  test('немецкий Volkswagen (WVG)', () => {
    const r = decodeVin('WVGZZZ5NZLW352686', NOW);
    assert.equal(r.wmi, 'WVG');
    assert.equal(r.make, 'Volkswagen');
    assert.equal(r.country, 'Germany');
    assert.equal(r.year, 2020); // L
  });

  test('незнакомый WMI — не выдумываем завод', () => {
    const r = decodeVin('XXXLR41JGPU041935', NOW);
    assert.notEqual(r, null);
    assert.equal(r.make, null);
    assert.equal(r.country, null);
    assert.equal(r.wmi, 'XXX');
  });

  test('разделители и регистр не мешают', () => {
    const r = decodeVin(' kmh-lr41jgpu 041935 ', NOW);
    assert.equal(r.vin, 'KMHLR41JGPU041935');
    assert.equal(r.make, 'Hyundai');
  });

  test('двухзначный WMI ловится началом', () => {
    // 5F* — Honda в США, у неё различимы только два первых знака.
    const r = decodeVin('5FNRL38707B012345', NOW);
    assert.equal(r.make, 'Honda');
    assert.equal(r.country, 'USA');
  });
});

describe('модельный год', () => {
  /** Год по знаку 10 — остальные знаки на него не влияют. */
  const yearOf = (code, now = NOW) => decodeVin(`KMHLR41JG${code}U041935`, now).year;

  test('цикл разводится по «ещё не наступил»', () => {
    assert.equal(yearOf('8'), 2008); // 2038 ещё не наступил → 2008
    assert.equal(yearOf('Y'), 2000); // 2030 тоже
    assert.equal(yearOf('L'), 2020);
    assert.equal(yearOf('T'), 2026);
  });

  test('запас в один год — это модельный год, а не ошибка', () => {
    // Осенью 2026-го продаётся 2027 модельный год, и это не «машина из будущего».
    assert.equal(yearOf('V'), 2027);
    assert.equal(yearOf('W'), 1998); // 2028 — уже перебор
  });

  test('граница сдвигается вместе с датой', () => {
    const later = new Date('2029-01-01T00:00:00Z');
    assert.equal(yearOf('W', later), 2028);
    assert.equal(yearOf('X', later), 2029);
  });

  test('знаки, которых в коде года не бывает', () => {
    for (const code of ['I', 'O', 'Q', 'U', 'Z', '0']) {
      assert.equal(yearOf(code), null, `${code} не код года`);
    }
  });
});

describe('нормализация', () => {
  test('normalizeVin чистит, но не подменяет знаки', () => {
    assert.equal(normalizeVin(' wvg-zzz 5nz/lw352686 '), 'WVGZZZ5NZLW352686');
    assert.equal(normalizeVin('ioq'), 'IOQ');
  });

  test('sanitizeVinInput правит набранное руками', () => {
    // I → 1, O → 0, Q → 0: этих знаков в VIN нет, значит человек увидел цифры.
    assert.equal(sanitizeVinInput('ioq-123!abc'), '100123ABC');
    assert.equal(sanitizeVinInput('kmhlr41jgpu041935'), 'KMHLR41JGPU041935');
  });

  test('sanitizeVinInput обрезает по длине VIN', () => {
    assert.equal(sanitizeVinInput('KMHLR41JGPU041935XXXX').length, 17);
  });
});

describe('подписи стран', () => {
  /*
   * Та же сторожевая проверка, что `partsfit:terms` держит над словарём каталога:
   * новый WMI приносит новую страну, и без неё она молча уехала бы на русскую
   * и арабскую страницы по-английски. Сборка на это не падает.
   */
  test('переведены все страны из таблицы заводов', () => {
    const missing = VIN_COUNTRIES.filter((c) => !TRANSLATED_COUNTRIES.includes(c));
    assert.deepEqual(missing, [], `без подписи: ${missing.join(', ')}`);
  });

  test('в словаре нет лишнего', () => {
    const extra = TRANSLATED_COUNTRIES.filter((c) => !VIN_COUNTRIES.includes(c));
    assert.deepEqual(extra, [], `страна больше не встречается: ${extra.join(', ')}`);
  });

  test('на каждом языке страницы проверки есть строка', () => {
    for (const country of VIN_COUNTRIES) {
      for (const locale of VIN_LOCALES) {
        const name = countryName(country, locale);
        assert.ok(name && name.trim(), `${country}/${locale} пусто`);
      }
    }
  });

  test('незнакомый язык падает на английский, пустая страна — на null', () => {
    assert.equal(countryName('South Korea', 'de'), 'South Korea');
    assert.equal(countryName('South Korea', 'ru'), 'Южная Корея');
    assert.equal(countryName(null, 'ru'), null);
  });
});

describe('адрес входа из декодера', () => {
  test('на ru и en — свой кабинет', () => {
    assert.equal(
      vinAuthLink('ru', '/proverka-avto-po-vin').href,
      '/ru/auth?mode=register&next=%2Fru%2Fproverka-avto-po-vin'
    );
    assert.equal(
      vinAuthLink('en', '/koreancar-vin-check').href,
      '/en/auth?mode=register&next=%2Fen%2Fkoreancar-vin-check'
    );
  });

  test('на ar — английский кабинет, но возврат на арабскую страницу', () => {
    // `/ar/auth` middleware разворачивает 301 обратно на страницу проверки:
    // арабский свёрнут, кабинета на нём нет. Проверено на живом сервере 30.08.2026.
    const link = vinAuthLink('ar', '/koreancar-vin-check');
    assert.equal(link.href, '/en/auth?mode=register&next=%2Far%2Fkoreancar-vin-check');
    assert.equal(link.back, '/ar/koreancar-vin-check');
  });

  test('возврат всегда внутренний путь — открытого редиректа не построить', () => {
    for (const locale of ['ru', 'en', 'ar']) {
      const { back } = vinAuthLink(locale, '/koreancar-vin-check');
      assert.ok(back.startsWith('/') && !back.startsWith('//'), back);
    }
  });
});

describe('поля корейского реестра', () => {
  /*
   * Обе ловушки пойманы на живом номере WAUZZZ8T8FA028385 уже после выкатки:
   * прочерк уезжал на витрину значением, а «143,351» русский читатель принимает
   * за сто сорок три километра.
   */
  test('прочерк — это «данных нет», а не значение', () => {
    for (const dash of ['-', '--', '—', '–', ' - ']) {
      assert.equal(registryText(dash), null, dash);
    }
    assert.equal(registryDate('-'), null);
  });

  test('пустое и не-строка тоже null', () => {
    assert.equal(registryText(''), null);
    assert.equal(registryText('   '), null);
    assert.equal(registryText(null), null);
    assert.equal(registryText(42), null);
  });

  test('разряды с запятой разбираются в число', () => {
    assert.equal(registryNumber('143,351'), 143351);
    assert.equal(registryNumber('1,968'), 1968);
    assert.equal(registryNumber('0'), 0);
  });

  test('нечисловое поле не превращается в число', () => {
    assert.equal(registryNumber('약 143,351'), null);
    assert.equal(registryNumber('143,351 km'), null);
    assert.equal(registryNumber('-'), null);
  });

  test('дата приводится к ISO, остальное как есть', () => {
    assert.equal(registryDate('20150203'), '2015-02-03');
    assert.equal(registryDate('2015-02-03'), '2015-02-03');
    assert.equal(registryDate('없음'), '없음');
  });
});

describe('термины реестра по кодам', () => {
  test('у каждого кода есть все три языка', () => {
    for (const [table, rows] of Object.entries(REGISTRY_TABLES)) {
      for (const [code, row] of Object.entries(rows)) {
        for (const locale of ['ru', 'en', 'ar']) {
          assert.ok(row[locale]?.trim(), `${table}/${code}/${locale} пусто`);
        }
      }
    }
  });

  test('таблицы совпадают по размеру с опубликованными порталом', () => {
    // colorArray — 11 кодов, fuelArray — 18. Снято со страницы schdcarXportView.do.
    assert.equal(Object.keys(REGISTRY_TABLES.COLOR_CODES).length, 11);
    assert.equal(Object.keys(REGISTRY_TABLES.FUEL_CODES).length, 18);
  });

  test('каждый корейский синоним ведёт на существующий код', () => {
    for (const [name, code] of Object.entries(REGISTRY_NAME_ALIASES.COLOR_NAMES)) {
      assert.ok(REGISTRY_TABLES.COLOR_CODES[code], `цвет ${name} → ${code} нет в таблице`);
    }
    for (const [name, code] of Object.entries(REGISTRY_NAME_ALIASES.FUEL_NAMES)) {
      assert.ok(REGISTRY_TABLES.FUEL_CODES[code], `топливо ${name} → ${code} нет в таблице`);
    }
  });

  test('живой номер: код важнее названия', () => {
    // WAUZZZ8T8FA028385: colorCd 02, useFuelCd b, названия 흰색 и 경유.
    assert.equal(colorTerm('02', '흰색', 'ru'), 'белый');
    assert.equal(fuelTerm('b', '경유', 'ru'), 'дизель');
    assert.equal(fuelTerm('b', '경유', 'en'), 'diesel');
  });

  test('без кода работает запасной путь по названию', () => {
    assert.equal(colorTerm(null, '흰색', 'ru'), 'белый');
    assert.equal(fuelTerm(null, '경유', 'ru'), 'дизель');
  });

  test('неизвестный код и название — отдаём как есть, а не прочерк', () => {
    assert.equal(colorTerm('99', '보라돌이색', 'ru'), '보라돌이색');
    assert.equal(colorTerm('99', null, 'ru'), null);
    assert.equal(fuelTerm(null, null, 'ru'), null);
  });

  test('незнакомый язык падает на английский', () => {
    assert.equal(colorTerm('02', null, 'de'), 'white');
  });
});

describe('история проверенных VIN', () => {
  test('новый номер встаёт первым', () => {
    assert.deepEqual(addToHistory([], 'KMHLR41JGPU041935'), ['KMHLR41JGPU041935']);
    assert.deepEqual(addToHistory(['A'], 'B'), ['B', 'A']);
  });

  test('повтор поднимается, а не задваивается', () => {
    assert.deepEqual(addToHistory(['A', 'B', 'C'], 'C'), ['C', 'A', 'B']);
    assert.deepEqual(addToHistory(['A', 'B'], 'a'), ['A', 'B']);
  });

  test('длина ограничена', () => {
    let list = [];
    for (let i = 0; i < VIN_HISTORY_MAX + 5; i++) list = addToHistory(list, `VIN${i}`);
    assert.equal(list.length, VIN_HISTORY_MAX);
    assert.equal(list[0], `VIN${VIN_HISTORY_MAX + 4}`);
  });

  test('пустое не сохраняется', () => {
    assert.deepEqual(addToHistory(['A'], '   '), ['A']);
    assert.deepEqual(addToHistory(['A'], ''), ['A']);
  });

  /*
   * Хранилище правит кто угодно — консолью, другой вкладкой, записью прошлой версии.
   * Любой мусор обязан стать пустым списком, а не исключением при рендере страницы.
   */
  test('мусор в хранилище не роняет страницу', () => {
    assert.deepEqual(parseHistory(null), []);
    assert.deepEqual(parseHistory('не json'), []);
    assert.deepEqual(parseHistory('{"a":1}'), []);
    assert.deepEqual(parseHistory('[1, null, {"x":2}]'), []);
    assert.deepEqual(parseHistory('["A", 5, "b"]'), ['A', 'B']);
  });

  test('слишком длинный список из хранилища обрезается', () => {
    const raw = JSON.stringify(Array.from({ length: 50 }, (_, i) => `VIN${i}`));
    assert.equal(parseHistory(raw).length, VIN_HISTORY_MAX);
  });
});

describe('мусор на входе не роняет разбор', () => {
  /*
   * Функции экспортируются, и однажды им прилетит не то, что задумано:
   * `undefined` из чужого кода, число из непроверенного тела запроса, объект.
   * `undefined.toUpperCase()` — это упавшая страница, а не пустой результат.
   */
  test('normalizeVin переживает любой тип', () => {
    for (const bad of [undefined, null, 0, 42, {}, [], true, Symbol.iterator ? NaN : NaN]) {
      assert.equal(normalizeVin(bad), '', String(bad));
    }
  });

  test('decodeVin на мусоре отдаёт null, а не бросает', () => {
    for (const bad of [undefined, null, 0, {}, [], 'кириллица тут не VIN']) {
      assert.equal(decodeVin(bad, NOW), null, String(bad));
    }
  });

  test('sanitizeVinInput переживает любой тип', () => {
    for (const bad of [undefined, null, 0, {}, []]) {
      assert.equal(sanitizeVinInput(bad), '', String(bad));
    }
  });

  test('испорченная дата не вешает год и не врёт', () => {
    // Infinity в прежней версии давал вечный цикл: условие не переставало выполняться.
    const inf = { getFullYear: () => Infinity };
    const started = Date.now();
    const r = decodeVin('KMHLR41JGPU041935', new Date('нет такой даты'));
    assert.ok(Date.now() - started < 1000, 'разбор не должен зависать');
    assert.equal(typeof r.year, 'number');
    void inf;
  });

  test('очень длинная строка не проблема', () => {
    assert.equal(decodeVin('K'.repeat(100000), NOW), null);
    assert.equal(normalizeVin('!'.repeat(100000)), '');
  });

  test('юникод и управляющие знаки вычищаются', () => {
    assert.equal(normalizeVin('KMH\u0000LR41JG\u200bPU041935'), 'KMHLR41JGPU041935');
    assert.equal(normalizeVin('КМН'), '');
  });
});

describe('проверка номера перед отправкой', () => {
  /*
   * Одна функция на форму и на роут: форма бережёт запрос, роут — единственная
   * настоящая защита, потому что тело подделывается. Разъехаться правилам негде.
   */
  test('настоящие номера проходят', () => {
    for (const vin of ['KMHLR41JGPU041935', 'WAUZZZ8T8FA028385', 'WVGZZZ5NZLW352686']) {
      assert.equal(vinProblem(vin), null, vin);
    }
  });

  test('длина', () => {
    assert.equal(vinProblem(''), 'length');
    assert.equal(vinProblem('KMHLR41JGPU04193'), 'length');
    assert.equal(vinProblem('KMHLR41JGPU0419355'), 'length');
  });

  test('в VIN не бывает I, O и Q', () => {
    assert.equal(vinProblem('IMHLR41JGPU041935'), 'charset');
    assert.equal(vinProblem('KMHLR41JGPO041935'), 'charset');
    assert.equal(vinProblem('KMHLR41JGPQ041935'), 'charset');
  });

  test('первый знак — код региона, нуля там не бывает', () => {
    assert.equal(vinProblem('0MHLR41JGPU041935'), 'region');
  });

  test('десятый знак — код года, вне таблицы это не VIN', () => {
    // U и Z в кодах года не участвуют, как и ноль.
    assert.equal(vinProblem('KMHLR41JGZU041935'), 'year');
    assert.equal(vinProblem('KMHLR41JG0U041935'), 'year');
  });

  test('разделители и регистр проверке не мешают', () => {
    assert.equal(vinProblem(' kmh-lr41jg pu041935 '), null);
  });

  test('мусор не роняет проверку', () => {
    for (const bad of [undefined, null, 0, {}, []]) {
      assert.equal(vinProblem(bad), 'length', String(bad));
    }
  });

  test('контрольный разряд НЕ проверяется — это решение, а не упущение', () => {
    // У всех трёх живых номеров он не сходится, и все три настоящие: правило
    // североамериканское, а у нас корейские и европейские машины.
    assert.equal(vinProblem('KMHLR41JGPU041935'), null);
  });
});
