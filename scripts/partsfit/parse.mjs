/**
 * Разбор корейского заголовка донора и словари к нему.
 *
 * Формат держится на всём каталоге, а не только на оптике — из 1248 заголовков,
 * снятых по девяти группам, форматом не разобрались четыре:
 *
 *   [тег] <марка> <модель> <год> <тип детали>(<позиция>/<сторона>) <партномер> <лот>
 *
 *   현대 쏘나타 2019 테일램프(외측/좌) 92401L1000
 *   BMW 5시리즈 2014 헤드램프(좌) 7 387 225-04 1
 *   BMW 5시리즈 2021 ECU 5A149A601
 *
 * Хвостовое число — НЕ остаток на складе. Проверено на позициях с «1», «2», «4»:
 * у всех остаток единица. Это номер лота, которым донор разводит одинаковые детали
 * с одной разборки. В `stock` его писать нельзя.
 *
 * Год ищется как последний четырёхзначный токен перед типом детали. Иначе у Пежо
 * с числовыми моделями — 2008, 3008, 5008 — годом становится имя модели.
 */

import { readFileSync } from 'node:fs';
import { dictPath } from './lib.mjs';

const load = (name) => JSON.parse(readFileSync(dictPath(name), 'utf8'));

export const BRANDS = load('brands');
export const MODELS = load('models');
export const PART_TYPES = load('part-types');

/** Длинные типы проверяем раньше коротких: «프론트도어» не должен съедаться «도어». */
const TYPE_ALTERNATION = Object.keys(PART_TYPES)
  .sort((a, b) => b.length - a.length)
  .map((type) => type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

/** Заголовок с известным типом детали: год привязан к типу, поэтому модель может быть числом. */
const KNOWN_RE = new RegExp(
  `^(?:\\[(?<tag>[^\\]]*)\\]\\s*)?(?<brand>\\S+)\\s+(?<model>.*?)\\s*(?<year>\\d{4})\\s+(?<rest>(?:${TYPE_ALTERNATION})(?:\\(|\\s|$).*)$`
);

/**
 * Запасной разбор — для типов, которых ещё нет в словаре. Модель жадная, поэтому годом
 * становится последний четырёхзначный токен, а не первый: у «푸조 2008 2019 헤드램프»
 * модель «2008», год 2019. Такие записи не публикуются, а уходят в отчёт о новых терминах.
 */
const UNKNOWN_RE =
  /^(?:\[(?<tag>[^\]]*)\]\s*)?(?<brand>\S+)\s+(?<model>.*)\s+(?<year>\d{4})\s+(?<rest>\S.*)$/;

/*
 * Скобок после типа детали бывает две, и это разные вещи:
 *
 *   테일램프(외측/좌)                  расположение и сторона
 *   컴비네이션램프(후미등)(우/조수석)   уточнение детали, затем сторона
 *   백피니셔(트렁크등)                 только уточнение, стороны нет
 *   헤드램프(좌)                       только сторона
 *
 * Поэтому берём все скобки подряд, а не первую: сторона всегда в последней.
 */
const REST_RE = /^(?<type>[^(（]+?)\s*(?<parens>(?:[(（][^)）]*[)）])+)\s*(?<tail>.*)$/;
const REST_NO_PARENS_RE = /^(?<type>\S+)\s*(?<tail>.*)$/;

export const SIDES = {
  좌: { full: 'Левый (LH)', ru: { m: 'левый', f: 'левая', n: 'левое' }, slug: 'levyy', keywords: ['левый', 'LH', 'водительский'] },
  우: { full: 'Правый (RH)', ru: { m: 'правый', f: 'правая', n: 'правое' }, slug: 'pravyy', keywords: ['правый', 'RH', 'пассажирский'] },
  양: { full: 'Комплект (L+R)', ru: { m: 'комплект', f: 'комплект', n: 'комплект' }, slug: 'komplekt', keywords: ['комплект', 'пара', 'L+R'] },
};

export const POSITIONS = {
  외측: { full: 'Внешний (в крыло)', ru: 'внешний', slug: 'naruzhnyy', keywords: ['внешний', 'в крыло', 'наружный'] },
  내측: { full: 'Внутренний (в крышку багажника)', ru: 'внутренний', slug: 'vnutrenniy', keywords: ['внутренний', 'в крышку', 'в багажник'] },
};

/** [중고] — б/у, [애프터마켓] — неоригинал. Второе покупателю знать обязательно. */
export const TAGS = { 중고: { used: true }, 애프터마켓: { aftermarket: true } };

/** Корейские дилеры продают Lincoln под маркой Ford. Покупатель ищет «Линкольн». */
export const LINCOLN_MODELS = new Set(['MKS', 'MKZ', 'MKX', 'Aviator', 'Continental', 'Nautilus', 'Town Car']);

/** «기타» = «прочее». Донор ставит его и вместо модели, и вместо марки. */
export const NOT_A_MODEL = new Set(['기타', '', '-']);
export const NOT_A_BRAND = new Set(['기타', '', '-']);

/**
 * Партномер отделяется от номера лота: лот — это одна-две цифры в самом конце,
 * а партномер обязан содержать не меньше пяти знаков. «…(외측/우) 5» — лот, номера нет.
 */
export function splitTail(tail) {
  const cleaned = String(tail || '').trim();
  if (!cleaned) return { oem: '', lot: '' };

  // Лот отделён пробелом, иначе «92102L8000» разрежется на номер «92102L80» и лот «00».
  if (/^\d{1,2}$/.test(cleaned)) return { oem: '', lot: cleaned };

  /*
   * Номер, записанный группами через пробел, лотом не режется: у «A 167 906 85 07»
   * (Mercedes) последняя группа — часть номера, а у «7 387 225-04 1» (BMW) — лот.
   * Различаем по длине последней группы: лот донор пишет одной цифрой, когда номер
   * и без того разбит на группы.
   */
  const groups = cleaned.split(/\s+/);
  if (groups.length >= 4 && groups.at(-1).length > 1) {
    return { oem: cleaned.replace(/\s+/g, '').toUpperCase(), lot: '' };
  }

  const lotMatch = cleaned.match(/^(.*\S)\s+(\d{1,2})$/);
  const candidate = (lotMatch ? lotMatch[1] : cleaned).trim();
  const lot = lotMatch ? lotMatch[2] : '';

  // Партномер донор пишет и слитно, и через пробелы: «7 387 225-04» = «7387225-04».
  if (/^[0-9A-Z][0-9A-Z\- ]{3,}$/i.test(candidate) && candidate.replace(/[^0-9A-Z]/gi, '').length >= 5) {
    return { oem: candidate.replace(/\s+/g, '').toUpperCase(), lot };
  }
  // Без хвостового лота номер мог занимать всю строку целиком.
  if (!lotMatch && /^[0-9A-Z][0-9A-Z\- ]{3,}$/i.test(cleaned)) {
    return { oem: cleaned.replace(/\s+/g, '').toUpperCase(), lot: '' };
  }
  return { oem: '', lot };
}

export const hasKorean = (value) => /[가-힣]/.test(String(value || ''));

/**
 * Марка и модель из словаря.
 *
 * Латиница словаря не требует: донор пишет ею уже международные имена — BMW, SM5, G80,
 * A6, XF. Заводить на них 97 записей вида `{en: 'A6', ru: []}` значило бы держать словарь,
 * который ничего не переводит, и получать «непокрытый термин» там, где всё в порядке.
 * Перевод нужен ровно для корейского написания, оно и проверяется.
 */
export function resolveBrand(brandKo) {
  // Марку «прочее» публиковать не под чем: посадочной страницы у неё быть не может.
  if (NOT_A_BRAND.has(brandKo)) return { en: '', ru: '', aliases: [], known: true };
  const known = BRANDS[brandKo];
  if (known) return { ...known, known: true };
  if (!hasKorean(brandKo)) return { en: brandKo, ru: '', aliases: [], known: true };
  return { en: brandKo, ru: '', aliases: [], known: false };
}

export function resolveModel(modelKo) {
  if (NOT_A_MODEL.has(modelKo)) return { en: '', ru: [], known: true };
  const known = MODELS[modelKo];
  if (known) return { en: known.en, ru: known.ru || [], known: true };
  if (!hasKorean(modelKo)) return { en: modelKo, ru: [], known: true };
  return { en: modelKo, ru: [], known: false };
}

/**
 * Разбор заголовка. Возвращает `known: false`, когда тип детали ещё не в словаре, —
 * такие записи собираются в отчёт, а не публикуются с иероглифами на витрине.
 */
export function parseTitle(titleKr) {
  const title = String(titleKr || '').trim();
  const matched = KNOWN_RE.exec(title);
  const groups = (matched || UNKNOWN_RE.exec(title))?.groups;
  if (!groups) return null;

  const rest = groups.rest.trim();
  const detail = (REST_RE.exec(rest) || REST_NO_PARENS_RE.exec(rest))?.groups;
  if (!detail) return null;

  const parens = detail.parens
    ? [...detail.parens.matchAll(/[(（]([^)）]*)[)）]/g)].map((found) => found[1].trim())
    : [];

  /*
   * Последняя группа — сторона, но только если она ею и является: у «백피니셔(트렁크등)»
   * скобка одна и в ней уточнение, а не «левый/правый».
   *
   * Внутри группы «/» значит разное. У «외측/좌» это расположение и сторона, у «우/조수석» —
   * одна и та же сторона, написанная дважды (правый = пассажирский). Различаем по тому,
   * стоит ли слева известное расположение.
   */
  const last = parens.at(-1) || '';
  const parts = last.split('/').map((piece) => piece.trim());
  const hasPosition = Boolean(POSITIONS[parts[0]]);
  const sideCandidate = hasPosition ? parts[1] : parts[0];
  const isSide = Boolean(SIDES[sideCandidate]);

  const typeRaw = detail.type.trim();
  // «컴비네이션램프(후미등)» — задний фонарь, «컴비네이션램프(안개등)» — противотуманка.
  // Уточнение меняет саму деталь, а не подпись к ней.
  const qualifier = parens.length > 1 || !isSide ? parens[0] || '' : '';
  const typeKo = PART_TYPES[typeRaw]?.qualifiers?.[qualifier] || typeRaw;

  const { oem, lot } = splitTail(detail.tail);

  return {
    known: Boolean(matched) && Boolean(PART_TYPES[typeKo]),
    tag: groups.tag?.trim() || '',
    brandKo: groups.brand.trim(),
    modelKo: groups.model.trim(),
    year: Number(groups.year),
    typeKo,
    typeRaw,
    qualifierKo: qualifier,
    positionKo: hasPosition ? parts[0] : '',
    sideKo: isSide ? sideCandidate : '',
    oem,
    lot,
  };
}
