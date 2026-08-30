/**
 * История проверенных VIN.
 *
 * Живёт только в браузере посетителя: на сервер не уходит, в счётчики не попадает,
 * к аккаунту не привязана. Это его собственные номера — удобство, а не наблюдение.
 * Поэтому же она не в базе: заводить таблицу ради списка из восьми строк, который
 * нужен одному человеку на одном устройстве, незачем.
 *
 * Оформлено внешним хранилищем под `useSyncExternalStore`, а не `useState` + эффект.
 * Причина не в стиле: чтение localStorage эффектом с `setState` — это каскадный рендер,
 * и правила React такое прямо запрещают (тот же линтер уже ловил нас на корзине).
 * Плюс `getServerSnapshot` честно отдаёт пустой список, и разметка первого рендера
 * совпадает с серверной — иначе была бы ошибка гидратации.
 *
 * Чистые функции отделены от хранилища намеренно: их тянет тест напрямую через
 * `--experimental-strip-types`, а localStorage там нет.
 */

export const VIN_HISTORY_KEY = 'caranalizer-vin-history';
export const VIN_HISTORY_MAX = 8;

/**
 * Разбор сохранённого. Хранилище правит кто угодно — руками через консоль, другой
 * вкладкой, сломанной записью прошлой версии, — поэтому форме доверять нельзя
 * и любой мусор превращается в пустой список, а не в исключение при рендере.
 */
export function parseHistory(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, VIN_HISTORY_MAX);
  } catch {
    return [];
  }
}

/** Новый номер в начало, повтор поднимается, хвост обрезается. */
export function addToHistory(list: readonly string[], vin: string): string[] {
  const value = vin.trim().toUpperCase();
  if (!value) return [...list];
  return [value, ...list.filter((item) => item !== value)].slice(0, VIN_HISTORY_MAX);
}

/* ------------------------------------------------- хранилище для React */

/** Одна и та же ссылка на пустой список: `useSyncExternalStore` сравнивает по ссылке. */
const EMPTY: string[] = [];

let cachedRaw: string | null = null;
let cachedList: string[] = EMPTY;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeHistory(listener: () => void): () => void {
  listeners.add(listener);
  // Другая вкладка тоже правит этот ключ — без подписки список бы разъехался.
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

/**
 * Снимок для `useSyncExternalStore`. Ссылка обязана быть стабильной, пока данные
 * не менялись, иначе React уходит в бесконечный рендер — отсюда кэш по сырой строке.
 */
export function getHistorySnapshot(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(VIN_HISTORY_KEY);
  } catch {
    return EMPTY;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedList = parseHistory(raw);
  }
  return cachedList;
}

/** На сервере истории нет и быть не может — первый рендер обязан совпасть. */
export function getHistoryServerSnapshot(): string[] {
  return EMPTY;
}

function write(next: string[]) {
  try {
    localStorage.setItem(VIN_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Приватный режим или переполненное хранилище: история — удобство, не повод падать.
  }
  emit();
}

export function rememberVin(vin: string) {
  write(addToHistory(getHistorySnapshot(), vin));
}

export function clearVinHistory() {
  try {
    localStorage.removeItem(VIN_HISTORY_KEY);
  } catch {}
  emit();
}
