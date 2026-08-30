import 'server-only';
import { createServerClient } from '@/lib/supabase';

/**
 * Ограничение частоты проверок по VIN — пять в сутки на аккаунт.
 *
 * **Считается на сервере, а не в браузере, и это принципиально.** Счётчик
 * в localStorage обнуляется очисткой хранилища и режимом инкогнито, то есть не мешает
 * ровно тому, от кого защищаемся. Защищаемся же не от посетителя, а за него: каждая
 * проверка — два похода к чужим службам, и если car365 сочтёт нас назойливыми,
 * он прикроет доступ всем сразу.
 *
 * **Окно скользящее — последние 24 часа, а не календарные сутки.** Календарные
 * потребовали бы выбрать, чья это полночь (корейская? московская? UTC?), и раз в сутки
 * давали бы всплеск обращений. У скользящего окна этого вопроса нет.
 */

export const VIN_DAILY_LIMIT = 5;

const WINDOW_MS = 24 * 60 * 60 * 1000;

export type VinQuota = {
  used: number;
  limit: number;
  /** Когда освободится место, ISO-строка. `null` — лимит не выбран. */
  resetsAt: string | null;
};

const FREE: VinQuota = { used: 0, limit: VIN_DAILY_LIMIT, resetsAt: null };

/**
 * Сколько проверок израсходовано за окно.
 *
 * При отказе базы **пропускаем**, а не блокируем. Проверка по VIN от нашей базы
 * не зависит вовсе: упавший Supabase не повод отказывать человеку в услуге, за которой
 * он пришёл. Обратный выбор превратил бы наш сбой в отказ обслуживания.
 */
export async function readQuota(userId: string): Promise<VinQuota> {
  try {
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const { data, error } = await createServerClient()
      .from('partsfit_vin_lookups')
      .select('looked_up_at')
      .eq('user_id', userId)
      .gte('looked_up_at', since)
      .order('looked_up_at', { ascending: true })
      .limit(VIN_DAILY_LIMIT + 1);

    if (error || !data) {
      console.warn('[vin] лимит не прочитан, пропускаем:', error?.message);
      return FREE;
    }

    const oldest = data[0]?.looked_up_at as string | undefined;
    return {
      used: data.length,
      limit: VIN_DAILY_LIMIT,
      // Место освобождается через сутки после самой старой проверки в окне.
      resetsAt: oldest ? new Date(new Date(oldest).getTime() + WINDOW_MS).toISOString() : null,
    };
  } catch (error) {
    console.warn('[vin] лимит не прочитан, пропускаем:', error);
    return FREE;
  }
}

/**
 * Записать состоявшуюся проверку.
 *
 * Пишет service_role: политики на insert для `authenticated` в миграции нет намеренно —
 * иначе браузер мог бы не записать свою проверку и тем обойти лимит.
 *
 * Отказ записи не роняет ответ: человек своё уже получил, а потерянная строка журнала
 * стоит меньше, чем отданная ему ошибка вместо готового отчёта.
 */
export async function recordLookup(userId: string, vin: string, registry: string) {
  try {
    const { error } = await createServerClient()
      .from('partsfit_vin_lookups')
      .insert({ user_id: userId, vin, registry });
    if (error) console.warn('[vin] проверка не записана:', error.message);
  } catch (error) {
    console.warn('[vin] проверка не записана:', error);
  }
}
