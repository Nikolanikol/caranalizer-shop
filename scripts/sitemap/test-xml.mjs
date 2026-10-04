// Карта сайта по частям: имена файлов, нарезка, XML. Настоящий модуль, не копия.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_URLS_PER_FILE,
  chunkNames,
  chunkPages,
  escapeXml,
  indexXml,
  parseChunkName,
  urlsetXml,
} from '../../src/lib/sitemap-xml.ts';

const page = (path, langs = ['ru', 'en']) => ({
  languages: Object.fromEntries(langs.map((l) => [l, `https://x.com/${l}${path}`])),
  xDefault: `https://x.com/ru${path}`,
});

test('файлов столько, сколько нужно под предел, и не меньше одного', () => {
  assert.deepEqual(chunkNames('parts', 'ru', 0), ['parts-ru-1']);
  assert.deepEqual(chunkNames('parts', 'ru', MAX_URLS_PER_FILE), ['parts-ru-1']);
  assert.deepEqual(chunkNames('parts', 'ru', MAX_URLS_PER_FILE + 1), ['parts-ru-1', 'parts-ru-2']);
});

test('имя файла разбирается обратно, мусор — нет', () => {
  assert.deepEqual(parseChunkName('parts-ru-2'), { section: 'parts', locale: 'ru', index: 1 });
  for (const bad of ['parts-ru-0', 'parts-ru', 'parts-ru-01', '../etc-ru-1', 'parts-rus-1', '']) {
    assert.equal(parseChunkName(bad), null, bad);
  }
});

test('нарезка не теряет и не повторяет адресов', () => {
  const pages = Array.from({ length: MAX_URLS_PER_FILE * 2 + 7 }, (_, i) => page(`/p${i}`));
  const chunks = [0, 1, 2].map((i) => chunkPages(pages, 'en', i));
  assert.deepEqual(chunks.map((c) => c.length), [MAX_URLS_PER_FILE, MAX_URLS_PER_FILE, 7]);
  assert.equal(new Set(chunks.flat().map((p) => p.languages.en)).size, pages.length);
  assert.equal(chunkPages(pages, 'en', 3).length, 0);
});

test('страница без версии на языке в его файл не попадает', () => {
  const pages = [page('/a', ['ru', 'en', 'ar']), page('/b')];
  assert.equal(chunkPages(pages, 'ar', 0).length, 1);
});

test('urlset: loc своего языка, hreflang на все версии и x-default, экранирование', () => {
  const xml = urlsetXml([page('/oem/A&B')], 'en');
  assert.match(xml, /<loc>https:\/\/x\.com\/en\/oem\/A&amp;B<\/loc>/);
  assert.match(xml, /hreflang="ru" href="https:\/\/x\.com\/ru\/oem\/A&amp;B"/);
  assert.match(xml, /hreflang="x-default" href="https:\/\/x\.com\/ru\/oem\/A&amp;B"/);
  assert.match(xml, /xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
  assert.doesNotMatch(xml, /A&B/);
});

test('индекс перечисляет файлы', () => {
  const xml = indexXml(['https://x.com/sitemaps/parts-ru-1.xml']);
  assert.match(xml, /<sitemapindex /);
  assert.match(xml, /<sitemap><loc>https:\/\/x\.com\/sitemaps\/parts-ru-1\.xml<\/loc><\/sitemap>/);
  assert.equal(escapeXml(`<'">`), '&lt;&apos;&quot;&gt;');
});
