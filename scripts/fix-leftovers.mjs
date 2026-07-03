import fs from 'fs';
const { translate } = await import('bing-translate-api');

const IN = 'data/translations_fixed.jsonl';
const OUT = 'data/translations_final.jsonl';

const lines = fs.readFileSync(IN, 'utf8').trim().split('\n');
const rows = lines.map(l => JSON.parse(l));

// ===== Шаг 1: уникальные корейские токены из EN =====
const tokens = new Map();
for (const r of rows) {
  if (!r.name_en) continue;
  const m = r.name_en.match(/[가-힣][가-힣A-Za-z0-9.]*/g);
  if (m) for (const t of m) tokens.set(t, (tokens.get(t) || 0) + 1);
}
const uniq = [...tokens.keys()];
console.log(`Уникальных корейских токенов в EN: ${uniq.length}`);

// ===== Шаг 2: переводим токены KO→EN батчами =====
const tokenMap = {};
const CACHE = 'data/token-map.json';
if (fs.existsSync(CACHE)) {
  Object.assign(tokenMap, JSON.parse(fs.readFileSync(CACHE, 'utf8')));
  console.log(`Из кэша: ${Object.keys(tokenMap).length}`);
}
const todo = uniq.filter(t => !(t in tokenMap));
const B = 20;
for (let i = 0; i < todo.length; i += B) {
  const chunk = todo.slice(i, i + B);
  try {
    const res = await translate(chunk.join('\n'), 'ko', 'en');
    const out = res.translation.split('\n');
    if (out.length === chunk.length) {
      for (let j = 0; j < chunk.length; j++) {
        const tr = out[j].trim();
        // не сохраняем пустые/неизменённые
        if (tr && !/[가-힣]/.test(tr)) tokenMap[chunk[j]] = tr;
      }
    }
  } catch (e) {
    console.log(`  токен-батч ${i / B}: ${e.message}`);
    await new Promise(r => setTimeout(r, 3000));
  }
  await new Promise(r => setTimeout(r, 300));
  if ((i / B) % 10 === 0) console.log(`  токены: ${i + chunk.length}/${todo.length}`);
}
fs.writeFileSync(CACHE, JSON.stringify(tokenMap, null, 1));
console.log(`Переведено токенов: ${Object.keys(tokenMap).length}`);

// ===== Шаг 3: применяем токены к EN =====
const sortedTokens = Object.keys(tokenMap).sort((a, b) => b.length - a.length);
let enFixed = 0;
for (const r of rows) {
  if (!r.name_en || !/[가-힣]/.test(r.name_en)) continue;
  let en = r.name_en;
  for (const t of sortedTokens) {
    if (en.includes(t)) en = en.replaceAll(t, tokenMap[t]);
  }
  en = en.replace(/\s{2,}/g, ' ').trim();
  if (en !== r.name_en) { r.name_en = en; enFixed++; }
}
console.log(`EN исправлено: ${enFixed}`);

// ===== Шаг 4: текстовые фиксы RU =====
const cyr = 'а-яА-ЯёЁ';
const wb = (w) => new RegExp(`(?<![${cyr}])${w}(?![${cyr}])`, 'g');
let ruTextFixed = 0;
for (const r of rows) {
  if (!r.name_ru) continue;
  const orig = r.name_ru;
  r.name_ru = r.name_ru
    .replace(wb('завершена'), 'в сборе')
    .replace(wb('завершено'), 'в сборе')
    .replace(wb('завершен'), 'в сборе')
    .replace(wb('Завершена'), 'В сборе')
    .replace(/\s{2,}/g, ' ').trim();
  if (r.name_ru !== orig) ruTextFixed++;
}
console.log(`RU текст-фиксы: ${ruTextFixed}`);

// ===== Шаг 5: перепрогон RU для битых строк =====
const bad = rows.filter(r =>
  r.name_ru && (
    /[가-힣]/.test(r.name_ru) ||
    /железнодорожн/i.test(r.name_ru) ||
    /Завершить/.test(r.name_ru)
  )
);
console.log(`RU на перепрогон: ${bad.length}`);

// Rail-переупорядочивание: "Rail X ..." → "X Rail ..."
function fixRailOrder(en) {
  const m = en.match(/^Rail\s+(\S+)(.*)$/);
  if (m) return `${m[1]} Rail${m[2]}`;
  return en;
}

let reOk = 0, reErr = 0;
for (let i = 0; i < bad.length; i += 10) {
  const chunk = bad.slice(i, i + 10);
  const enArr = chunk.map(r => fixRailOrder(r.name_en));
  try {
    const res = await translate(enArr.join('\n'), 'en', 'ru');
    const out = res.translation.split('\n');
    if (out.length === chunk.length) {
      for (let j = 0; j < chunk.length; j++) {
        chunk[j].name_ru = out[j].trim();
        reOk++;
      }
    } else { reErr += chunk.length; }
  } catch (e) {
    reErr += chunk.length;
    await new Promise(r => setTimeout(r, 3000));
  }
  await new Promise(r => setTimeout(r, 300));
  if ((i / 10) % 20 === 0) console.log(`  RU перепрогон: ${i + chunk.length}/${bad.length}`);
}
console.log(`RU перепрогнано: ${reOk}, ошибок: ${reErr}`);

// ===== Сохраняем =====
fs.writeFileSync(OUT, rows.map(r => JSON.stringify(r)).join('\n') + '\n');
console.log(`\nФайл: ${OUT} (${rows.length} строк)`);
