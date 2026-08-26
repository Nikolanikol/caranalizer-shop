/**
 * Описание донора -> состояние, техпризнаки, кросс-номера.
 *
 * Донор пишет описание свободным текстом, поэтому здесь не перевод, а поиск маркеров.
 * Всё, что не разобралось, остаётся в `raw`: менеджер видит исходную строку целиком,
 * даже если словарь чего-то не знает.
 */

import { readFileSync } from 'node:fs';
import { dictPath } from './lib.mjs';

const CONDITION = JSON.parse(readFileSync(dictPath('condition'), 'utf8'));
const ATTRIBUTES = JSON.parse(readFileSync(dictPath('attributes'), 'utf8'));

/** Донор пишет латиницу как придётся: «HID», «hid», «Full LED». Сравниваем в верхнем регистре. */
const upper = (value) => String(value || '').toUpperCase();

/** «DLR X», «모듈 없음» — это отсутствие признака, а не его наличие. */
const NEGATIONS = ['X', '없음', '없슴', '무', 'NO'];

function matchTerm(text, term) {
  const haystack = upper(text);
  const needle = upper(term);
  let at = haystack.indexOf(needle);

  while (at >= 0) {
    const after = haystack.slice(at + needle.length, at + needle.length + 4).trim();
    if (!NEGATIONS.some((no) => after.startsWith(no))) return term;
    at = haystack.indexOf(needle, at + needle.length);
  }
  return null;
}

/** Возвращает конкретный сработавший термин — он нужен, чтобы убрать перекрытия. */
const firstTerm = (text, terms) => terms.map((term) => matchTerm(text, term)).find(Boolean) || null;
const has = (text, terms) => Boolean(firstTerm(text, terms));

/**
 * Грейд — по худшему найденному маркеру. Совпадение «состояние отличное» и «трещина»
 * в одном описании встречается регулярно: донор хвалит поверхность и тут же
 * оговаривает поломку крепления. Покупателю важна поломка.
 */
export function condition(description) {
  const text = String(description || '').trim();
  if (!text) return { grade: '', ru: '', notes: [], raw: '' };

  const rank = (grade) => CONDITION.grades[grade].rank;
  const found = CONDITION.markers
    .map((marker) => ({ marker, term: firstTerm(text, marker.ko) }))
    .filter((hit) => hit.term);

  const worst = found.reduce((a, b) => (!a || rank(b.marker.grade) > rank(a.marker.grade) ? b : a), null);
  const grade = worst ? worst.marker.grade : 'A+';

  // «생활스크래치» содержит «스크래치», поэтому срабатывают оба маркера, и покупатель
  // читает «царапины; мелкие бытовые царапины». Оставляем более точный — длинный термин.
  const specific = found.filter(
    (hit) => !found.some((other) => other !== hit && upper(other.term).includes(upper(hit.term)))
  );

  // Достоинства словами не пересказываем: «состояние хорошее» уже сказано грейдом,
  // а дефект обязан быть назван. Поэтому в заметки идут только маркеры B и C.
  const defects = specific.filter((hit) => rank(hit.marker.grade) >= rank('B')).map((hit) => hit.marker.ru);
  const notes = CONDITION.notes.filter((note) => has(text, note.ko)).map((note) => note.ru);

  return { grade, ru: CONDITION.grades[grade].ru, notes: [...new Set([...defects, ...notes])], raw: text };
}

function pick(text, rules) {
  const hit = rules.find((rule) => has(text, rule.ko));
  return hit ? { code: hit.code, ru: hit.ru } : null;
}

/**
 * Технические признаки. `allowed` — список групп словаря, применимых к этому типу детали;
 * его задаёт `attributes` в part-types.json.
 *
 * Без такой развязки словарь протекает между группами: «LED리피터» у зеркала (светодиодный
 * повторитель поворота) прочитывался как «светодиодная лампа», а «어셈블리» у блока
 * комфорта — как комплектация фары. Признак не просто лишний, он неверный: покупатель
 * зеркала читает про тип лампы, которого у зеркала нет.
 */
export function attributes(description, allowed = ['lampType', 'completeness', 'features', 'pins']) {
  const text = String(description || '').trim();
  const on = (group) => allowed.includes(group);
  const empty = { lampType: null, completeness: null, features: [], pins: 0, pinsLayout: '', color: null };
  if (!text) return empty;

  // Раскладка разъёма («3+2+2») сохраняется как есть, а в pins кладётся сумма:
  // по ней фильтруют, по раскладке сверяют колодку с машиной.
  const layout = on('pins') ? text.match(new RegExp(ATTRIBUTES.pins.pattern))?.[1].replace(/\s+/g, '') || '' : '';
  const pins = layout ? layout.split('+').reduce((sum, part) => sum + Number(part), 0) : 0;

  const features = [
    ...(on('features') ? ATTRIBUTES.features : []),
    ...(on('mirrorFeatures') ? ATTRIBUTES.mirrorFeatures : []),
  ].filter((rule) => has(text, rule.ko));

  return {
    lampType: on('lampType') ? pick(text, ATTRIBUTES.lampType) : null,
    completeness: on('completeness') ? pick(text, ATTRIBUTES.completeness) : null,
    features: features.map((rule) => ({ code: rule.code, ru: rule.ru })),
    pins,
    pinsLayout: layout.includes('+') ? layout : '',
    color: on('color') ? color(text) : null,
  };
}

/**
 * Цвет кузова: «4SS: SILKY SILVER». Код важнее названия — по нему покупатель сверяется
 * с табличкой на своей машине, а название донор пишет как придётся.
 */
export function color(description) {
  const text = String(description || '');
  const full = text.match(new RegExp(ATTRIBUTES.color.pattern));
  if (full) return { code: full[1].toUpperCase(), name: full[2].trim().replace(/\s+/g, ' ') };

  // «검정(색상 코드: AF)» — код есть, английского названия нет. Корейское название
  // рядом не переводим: цвет по-корейски покупателю не поможет, а код поможет.
  const codeOnly = text.match(new RegExp(ATTRIBUTES.color.patternCode));
  return codeOnly ? { code: codeOnly[1].toUpperCase(), name: '' } : null;
}

/**
 * Кросс-номера из описания. Донор перечисляет номера аналогов подряд с основным,
 * поэтому основной из результата исключается вызывающей стороной.
 *
 * Год («2019») и число пинов («8핀») номерами не являются: отсекаем по длине и по тому,
 * что рядом стоит корейская мерная приставка.
 */
export function crossNumbers(description, exclude = []) {
  const text = String(description || '');
  const skip = new Set(exclude.map((n) => String(n).replace(/[^0-9A-Z]/gi, '').toUpperCase()));
  const found = new Set();

  for (const [, candidate] of text.matchAll(new RegExp(ATTRIBUTES.crossNumbers.pattern, 'g'))) {
    const clean = candidate.replace(/\s+/g, '').replace(/-$/, '').toUpperCase();
    const digits = (clean.match(/\d/g) || []).length;
    if (digits < ATTRIBUTES.crossNumbers.minDigits) continue;
    if (/^(19|20)\d{2}$/.test(clean)) continue;
    if (skip.has(clean.replace(/[^0-9A-Z]/g, ''))) continue;
    found.add(clean);
  }

  return [...found];
}
