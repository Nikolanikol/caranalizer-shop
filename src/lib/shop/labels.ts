import type { AutoPart } from '@/types/part';
import { CATEGORY_EN, POSITION_EN, SIDE_EN, type ShopLocale, term } from './terms';

/**
 * Подписи для карточки товара. Файл без `server-only`: им пользуются и витрина, и корзина.
 *
 * Главное правило здесь — не выпячивать достоинство и не прятать дефект. Продаём б/у деталь
 * с разборки, и состояние покупатель обязан увидеть раньше, чем цену.
 *
 * **Язык подставляется здесь, а не в слое данных.** `AutoPart` и `Offer` хранят русские
 * термины донора как есть, и это намеренно: заявка в Telegram обязана прийти по-русски
 * независимо от языка покупателя — читает её русскоязычный менеджер. Локализуй мы каталог
 * на выходе из базы, английский заказ уехал бы в рабочий чат по-английски.
 */

export type ConditionTone = 'neutral' | 'warn' | 'danger';

export interface ConditionLabel {
  /** Короткая подпись на фотографию. Грейд оставляем: он есть в карточке и в заметках. */
  short: string;
  tone: ConditionTone;
}

/**
 * Грейды приходят из данных донора: A+ ставится, когда в описании не нашлось слов о дефектах,
 * B — царапины, C — трещина или сломанное крепление.
 *
 * Поэтому A+ подписан «дефектов не отмечено», а не «отличное состояние»: это ровно то,
 * что мы знаем, и не обещание, которого нам никто не давал.
 */
export function conditionLabel(
  part: Pick<AutoPart, 'conditionGrade'>,
  locale: ShopLocale = 'ru',
): ConditionLabel {
  const en = locale === 'en';
  switch (part.conditionGrade) {
    case 'C':
      return { short: en ? 'C · damaged' : 'C · есть повреждение', tone: 'danger' };
    case 'B':
      return { short: en ? 'B · scratches' : 'B · царапины', tone: 'warn' };
    case 'A':
      return { short: en ? 'A · good condition' : 'A · состояние хорошее', tone: 'neutral' };
    case 'A+':
      return { short: en ? 'A+ · no defects noted' : 'A+ · дефектов не отмечено', tone: 'neutral' };
    default:
      /*
       * Пустой грейд значит, что донор о состоянии не написал ничего, — а таких
       * экземпляров 9 733 из 34 724. Раньше сюда попадала подпись « · дефектов
       * не отмечено»: обещание о состоянии, которого мы не знаем, да ещё и с пустым
       * местом вместо буквы. Молчание донора — повод предупредить, а не успокоить.
       */
      return { short: en ? 'Condition not specified' : 'Состояние не указано', tone: 'warn' };
  }
}

export const CONDITION_CLASS: Record<ConditionTone, string> = {
  neutral: 'bg-zinc-100 text-zinc-900',
  warn: 'bg-amber-400 text-amber-950',
  danger: 'bg-red-500 text-white',
};

/**
 * Короткое описание детали без марки и модели: в карточке они выносятся в заголовок,
 * иначе при обрезке в две строки исчезает именно то, что человек ищет глазами.
 */
export function partDescriptor(
  part: Pick<AutoPart, 'category' | 'categoryRu' | 'side' | 'position'>,
  locale: ShopLocale = 'ru',
): string {
  if (locale === 'en') {
    // По-английски сторона и позиция читаются как есть: «Left (LH)», «Outer (fender)».
    // Строчными их не опускаем — LH и RH это аббревиатуры, а не слова.
    return [
      categoryTitle(part.category, locale),
      term(part.side, locale, SIDE_EN),
      term(part.position, locale, POSITION_EN),
    ]
      .filter(Boolean)
      .join(' · ');
  }

  const side = part.side.startsWith('Лев')
    ? 'левый'
    : part.side.startsWith('Прав')
      ? 'правый'
      : part.side.toLowerCase();

  const position = part.position.startsWith('Внеш')
    ? 'внешний'
    : part.position.startsWith('Внутр')
      ? 'внутренний'
      : '';

  return [part.categoryRu, side, position].filter(Boolean).join(' · ');
}

/**
 * Имя типа детали на языке страницы. Русское берётся из `categoryRu` (оно уже лежит
 * в данных), английское — из словаря по сегменту адреса.
 */
export function categoryTitle(category: string, locale: ShopLocale): string {
  if (locale === 'en') return CATEGORY_EN[category]?.title ?? category;
  return category;
}

export function categoryPlural(category: string, locale: ShopLocale, fallback: string): string {
  if (locale === 'en') return CATEGORY_EN[category]?.plural ?? fallback;
  return fallback;
}

/**
 * Заголовок товара целиком: «Headlight Left (LH) Kia Sorento (2015)».
 *
 * По-русски заголовок берётся готовым из данных (`title_ru`) — его собрал скрапер
 * по своим словарям. По-английски собираем здесь из тех же составных частей: тип детали,
 * сторона, позиция, марка, модель, годы. Ни одна из них не требует перевода прозы —
 * марка и модель латиницей, годы цифрами.
 */
export function partTitle(
  part: Pick<AutoPart, 'category' | 'titleRu' | 'side' | 'position' | 'brand' | 'model' | 'years'>,
  locale: ShopLocale,
): string {
  if (locale !== 'en') return part.titleRu;
  return [
    categoryTitle(part.category, locale),
    term(part.side, locale, SIDE_EN),
    term(part.position, locale, POSITION_EN),
    part.brand,
    part.model,
    part.years && `(${part.years})`,
  ]
    .filter(Boolean)
    .join(' ');
}

/** Заголовок карточки: сначала машина. «BMW 5 Series (2019)». */
export function partHeading(part: Pick<AutoPart, 'brand' | 'model' | 'year'>): string {
  return [part.brand, part.model, `(${part.year})`].filter(Boolean).join(' ');
}
