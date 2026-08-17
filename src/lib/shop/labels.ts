import type { AutoPart } from '@/types/part';

/**
 * Подписи для карточки товара. Файл без `server-only`: им пользуются и витрина, и корзина.
 *
 * Главное правило здесь — не выпячивать достоинство и не прятать дефект. Продаём б/у деталь
 * с разборки, и состояние покупатель обязан увидеть раньше, чем цену.
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
export function conditionLabel(part: Pick<AutoPart, 'conditionGrade'>): ConditionLabel {
  switch (part.conditionGrade) {
    case 'C':
      return { short: 'C · есть повреждение', tone: 'danger' };
    case 'B':
      return { short: 'B · царапины', tone: 'warn' };
    default:
      return { short: `${part.conditionGrade} · дефектов не отмечено`, tone: 'neutral' };
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
export function partDescriptor(part: Pick<AutoPart, 'categoryRu' | 'side' | 'position'>): string {
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

/** Заголовок карточки: сначала машина. «BMW 5 Series (2019)». */
export function partHeading(part: Pick<AutoPart, 'brand' | 'model' | 'year'>): string {
  return [part.brand, part.model, `(${part.year})`].filter(Boolean).join(' ');
}
