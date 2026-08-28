/**
 * Общий слой скрапера skywheel.kr — доска объявлений о продаже колёсных дисков.
 *
 * Донор — gnuboard («그누보드») с самописным скином. Всё нужное отдаётся обычным HTML,
 * headless-браузер не нужен и не должен появиться: карточка товара содержит готовую
 * таблицу «поле — значение» (제조사, 사이즈, 구분, 판매지역, 휠상태, 판매가격),
 * галерею и текст описания.
 *
 * Отличие от partsfit, из которого всё остальное: это НЕ каталог поставщика, а доска
 * объявлений. Отсюда два следствия для кода:
 *   1. Объём мал (сотня объявлений), поэтому оба прохода — листинг и карточки — идут
 *      за один запуск: экономить на карточках нечего.
 *   2. Позиции живут ровно до продажи и исчезают без следа, поэтому `firstSeen`
 *      и `lastSeen` в индексе обязательны — повторным прогоном их не восстановить.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const DATA = resolve(ROOT, 'data/skywheel');

export const ORIGIN = 'https://www.skywheel.kr';
export const BOARD = 'market';

export const listUrl = (page) => `${ORIGIN}/board/bbs/board.php?bo_table=${BOARD}&page=${page}`;
export const itemUrl = (id) => `${ORIGIN}/board/bbs/board.php?bo_table=${BOARD}&wr_id=${id}`;

/** Адреса картинок в разметке относительные (`../data/file/…`) — разворачиваем к абсолютным. */
export const imageUrl = (src) => new URL(src.replace(/^\.\.\//, ''), `${ORIGIN}/board/`).href;

export const indexPath = () => resolve(DATA, 'index.json');
export const itemsPath = () => resolve(DATA, 'items.json');
export const wheelsPath = () => resolve(DATA, 'wheels.json');

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/** Запрос с повторами: сеть до Кореи рвётся, а прогон стоит полторы сотни запросов. */
export async function fetchHtml(url, { retries = 3, timeout = 30000 } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(timeout),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      if (attempt > retries) throw new Error(`${url} -> ${error.message}`);
      await sleep(attempt * 1500);
    }
  }
}

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

export function decode(value) {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/ /g, ' ');
}

/** HTML → текст с сохранением переводов строк: описание донора размечено <p> и <br>. */
export function htmlToText(html) {
  return decode(
    String(html)
      .replace(/<(br|\/p|\/div|\/li)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .filter((line, i, all) => line || all[i - 1])
    .join('\n')
    .trim();
}

export function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
