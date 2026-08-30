/**
 * Разбор значений корейского реестра.
 *
 * Отдельным модулем, а не парой функций внутри `sources.ts`, по одной причине:
 * `sources.ts` помечен `server-only` и в тест не импортируется. Обе ловушки ниже
 * поймались на живом номере уже после выкатки — значит, должны ловиться тестом.
 */

/**
 * Строковое поле. Прочерк реестр использует как «данных нет»: у машины, снятой
 * с учёта, но ещё не вывезенной, дата отметки о вывозе приходит как `-`. Без этой
 * ветки прочерк уезжал на витрину полноценным значением.
 */
export function registryText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed && !/^[-—–]+$/.test(trimmed) ? trimmed : null;
}

/**
 * Числовое поле. Реестр разделяет разряды запятой (`143,351` км, `1,968` см³),
 * а русский читатель видит в запятой десятичный разделитель — «143,351 км»
 * читается как сто сорок три километра. Поэтому возвращаем число, а разряды
 * расставляет страница по своей локали.
 */
export function registryNumber(value: unknown): number | null {
  const raw = registryText(value);
  if (!raw) return null;
  // Только цифры и разделители: «약 143,351» или «143,351 km» — это не число.
  if (!/^[\d\s,]+$/.test(raw)) return null;
  const parsed = Number(raw.replace(/[\s,]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

/** `20241103` → `2024-11-03`. Что не восьмизначное — отдаём как есть. */
export function registryDate(value: unknown): string | null {
  const raw = registryText(value);
  if (!raw || !/^\d{8}$/.test(raw)) return raw;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}
