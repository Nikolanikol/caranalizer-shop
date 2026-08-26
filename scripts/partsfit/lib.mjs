/**
 * Общий слой скрапера partsfit.co.kr: адреса донора, вежливый HTTP, пути к данным.
 *
 * Донор — магазин на CAFE24. Всё, что нам нужно, отдаётся обычным HTML: JS для получения
 * данных не требуется нигде, включая описание товара (оно дублируется в <meta name="description">).
 * Поэтому здесь нет headless-браузера и не должно появиться: он на порядок медленнее
 * и ломается от смены вёрстки чаще, чем регулярка по метатегу.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const DATA = resolve(ROOT, 'data/partsfit');
export const DICT = resolve(ROOT, 'scripts/partsfit/dict');

export const ORIGIN = 'https://partsfit.co.kr';

/**
 * Группы донора. Ключ — наш стабильный код, `no` — cate_no в адресах магазина.
 *
 * Скрапим только эту нарезку. У донора есть вторая, параллельная (cate_no 112–116:
 * «передние детали», «задние детали», «салон/электрика»…) — тот же товар, разложенный
 * иначе. Их сумма совпадает со счётчиком в шапке сайта, а сумма групп ниже его превышает:
 * одна деталь попадает в несколько узлов. Дедупликация — по product_no.
 */
export const GROUPS = {
  'side-mirrors': { no: 42, ko: '사이드 미러', ru: 'Боковые зеркала' },
  headlights: { no: 43, ko: '전조등', ru: 'Фары' },
  taillights: { no: 44, ko: '후미등', ru: 'Фонари' },
  bumpers: { no: 45, ko: '범퍼/후드/라디에이터그릴', ru: 'Бамперы, капоты, решётки' },
  doors: { no: 46, ko: '도어', ru: 'Двери' },
  fenders: { no: 47, ko: '펜더', ru: 'Крылья' },
  'control-units': { no: 48, ko: '컨트롤 유닛', ru: 'Блоки управления' },
  sensors: { no: 49, ko: '센서류', ru: 'Датчики' },
  wheels: { no: 50, ko: '휠/타이어', ru: 'Колёса и шины' },
  misc: { no: 51, ko: '기타부품', ru: 'Прочие детали' },
  donor_cars: { no: 103, ko: '부품용차량', ru: 'Машины на разбор' },
};

export function groupByName(name) {
  const group = GROUPS[name];
  if (!group) {
    throw new Error(`Неизвестная группа «${name}». Есть: ${Object.keys(GROUPS).join(', ')}`);
  }
  return { name, ...group };
}

export const listUrl = (no, page) => `${ORIGIN}/product/list.html?cate_no=${no}&page=${page}`;
export const detailUrl = (productNo, no) =>
  `${ORIGIN}/product/detail.html?product_no=${productNo}&cate_no=${no}&display_group=1`;

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/**
 * Запрос с повторами. Донор не отдаёт 429 и не режет по скорости, но сеть до Кореи
 * рвётся регулярно, а проход по группе — тысячи запросов: одна потеря не должна
 * стоить всего прогона.
 */
export async function fetchHtml(url, { retries = 3, timeout = 30000 } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      const stop = AbortSignal.timeout(timeout);
      const response = await fetch(url, { headers: { 'User-Agent': UA }, signal: stop });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      if (attempt > retries) throw new Error(`${url} -> ${error.message}`);
      await sleep(attempt * 1500);
    }
  }
}

/**
 * Очередь с ограничением по числу одновременных запросов и паузой между ними.
 *
 * Пять потоков с паузой в треть секунды — примерно три страницы в секунду. Это заметно
 * медленнее, чем может выдержать CAFE24, и намеренно: донор нам поставщик, а не мишень,
 * и полный обход всё равно укладывается в четверть часа.
 */
export async function mapLimit(items, limit, worker, { onProgress, pause = 300 } = {}) {
  const results = new Array(items.length);
  let cursor = 0;
  let done = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
      done++;
      if (onProgress && done % 10 === 0) onProgress(done, items.length);
      if (pause) await sleep(pause);
    }
  });

  await Promise.all(runners);
  if (onProgress) onProgress(done, items.length);
  return results;
}

export function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Пишем с переводом строки в конце и отсортированно — чтобы `git diff` читался глазами. */
export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export const dictPath = (name) => resolve(DICT, `${name}.json`);
export const indexPath = (group) => resolve(DATA, 'index', `${group}.json`);
export const detailsPath = (group) => resolve(DATA, 'details', `${group}.json`);
export const tablePath = (table) => resolve(DATA, 'tables', `${table}.json`);
