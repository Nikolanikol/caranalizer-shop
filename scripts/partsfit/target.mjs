/**
 * К какой базе подключаемся — и защита от «залил в прод, не заметив».
 *
 * В проекте лежат два набора ключей: `.env.local` с локальным Supabase и `.env`
 * с боевыми. Читаются они в таком порядке, локальный перекрывает боевой, — но полагаться
 * на порядок чтения в вопросе «куда уедут 30 тысяч строк» нельзя.
 *
 * Поэтому адрес проверяется явно, и защита стоит с ОБЕИХ сторон:
 *   * без `--prod` скрипт не пойдёт на боевой адрес — можно залить лишнего;
 *   * с `--prod` он не пойдёт на локальный — иначе проверка отрапортует зелёным,
 *     а прод останется нетронутым. Ошибка тише первой и потому опаснее.
 *
 * Имена переменных. Скрипты исторически читают `SUPABASE_URL`/`SUPABASE_ANON_KEY`,
 * а сайт — `NEXT_PUBLIC_*`, и боевые ключи в `.env` лежат только под вторыми именами.
 * Отсюда запасной вариант ниже: без него `--prod` молча уходил в локальную базу.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { ROOT } from './lib.mjs';

/**
 * `.env.local` идёт первым: уже установленная переменная не перезаписывается.
 *
 * При `prod: true` он не читается вовсе. Этот файл существует ровно для того, чтобы
 * уводить скрипты в локальную базу, — в боевом прогоне это ровно та подмена,
 * от которой мы защищаемся.
 */
export function loadEnv({ prod = false } = {}) {
  for (const name of prod ? ['.env'] : ['.env.local', '.env']) {
    const path = resolve(ROOT, name);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const found = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (found && !process.env[found[1]]) {
        process.env[found[1]] = found[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  }
}

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', 'host.docker.internal']);

export function isLocal(url) {
  try {
    return LOCAL_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * Клиенты к базе. `allowProd` — это флаг `--prod` из командной строки вызывающего
 * скрипта, и без него на боевой адрес скрипт не пойдёт.
 */
export function connect({ allowProd = false, needAnon = false } = {}) {
  loadEnv({ prod: allowProd });

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    console.error(
      'Нет доступа к базе. Локальный стек поднимается так:\n' +
        '  npm run db:start\n\n' +
        'Он сам пропишет ключи в .env.local. Для боевой базы нужны в .env:\n' +
        '  NEXT_PUBLIC_SUPABASE_URL (или SUPABASE_URL)\n' +
        '  SUPABASE_SERVICE_ROLE_KEY\n' +
        'и запуск с флагом --prod.'
    );
    process.exit(1);
  }

  const local = isLocal(url);
  const host = new URL(url).host;

  if (!local && !allowProd) {
    console.error(
      `\nОстановлено: ${host} — это не локальная база.\n\n` +
        'Скрипт пишет десятки тысяч строк, и делать это в прод по невнимательности нельзя.\n' +
        'Если вы правда хотите в прод — добавьте флаг --prod. Если нет — поднимите\n' +
        'локальный стек: npm run db:start'
    );
    process.exit(1);
  }

  if (local && allowProd) {
    console.error(
      `\nОстановлено: передан --prod, но адрес локальный (${host}).\n\n` +
        'Так прогон ушёл бы в локальную базу и отрапортовал успехом, а прод остался бы\n' +
        'нетронутым — и это выяснилось бы после выкатки кода.\n\n' +
        'Боевой адрес и ключ ищутся в .env под именами NEXT_PUBLIC_SUPABASE_URL\n' +
        '(или SUPABASE_URL) и SUPABASE_SERVICE_ROLE_KEY. Проверьте, что они там есть\n' +
        'и что переменная SUPABASE_URL не выставлена в окружении оболочки.'
    );
    process.exit(1);
  }

  if (!local) {
    console.log(`\n\x1b[33m!!! БОЕВАЯ БАЗА: ${host} !!!\x1b[0m\n`);
  } else {
    console.log(`База: ${host} (локальная)`);
  }

  const options = { auth: { persistSession: false } };
  return {
    url,
    local,
    admin: createClient(url, serviceKey, options),
    anon: needAnon && anonKey ? createClient(url, anonKey, options) : null,
  };
}
