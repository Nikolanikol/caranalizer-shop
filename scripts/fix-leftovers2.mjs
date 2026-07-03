import fs from 'fs';
const { translate } = await import('bing-translate-api');

const IN = 'data/translations_final.jsonl';
const OUT = 'data/translations_final2.jsonl';

const rows = fs.readFileSync(IN, 'utf8').trim().split('\n').map(l => JSON.parse(l));

const cyr = 'а-яА-ЯёЁ';
const wb = (w) => new RegExp(`(?<![${cyr}])${w}(?![${cyr}])`, 'g');

// ===== Шаг 1: словарные фиксы RU =====
const RU_FIXES = [
  [/Тюленье масло/g, 'Сальник'],
  [wb('Шашка'), 'Ограничитель'], [wb('шашка'), 'ограничитель'],
  [wb('Шашки'), 'Ограничители'],
  [wb('Палуба'), 'Платформа'], [wb('палуба'), 'платформа'],
  [wb('Палубы'), 'Платформы'], [wb('палубы'), 'платформы'],
  [wb('Палубу'), 'Платформу'], [wb('палубу'), 'платформу'],
  [wb('палубе'), 'платформе'], [wb('Палубе'), 'Платформе'],
  [/Весенн\w+/g, 'Пружинная'], [/весенн\w+/g, 'пружинная'],
  [wb('Весна'), 'Пружина'], [wb('весна'), 'пружина'],
  [/Пружина переворота/g, 'Пружина перекидная'],
  [wb('Бомбей'), 'Баллон'], [wb('бомбей'), 'баллон'],
  [wb('бомбу'), 'баллон'], [wb('бомба'), 'баллон'], [wb('бомб'), 'баллонов'],
  [/Жилищный контроль/g, 'Корпус блока управления'],
  [wb('Жилищный'), 'Корпус'], [wb('жилищный'), 'корпус'],
  [/Правый поручень не могу/g, 'Рейка кант правая'],
  [/Левый поручень не могу/g, 'Рейка кант левая'],
  [wb('поручень'), 'рейка'], [wb('Поручень'), 'Рейка'],
  [wb('Ворота'), 'Борт'], [wb('ворота'), 'борт'],
  [wb('Воротами'), 'Бортом'],
];

let wordFixed = 0;
for (const r of rows) {
  if (!r.name_ru) continue;
  const orig = r.name_ru;
  for (const [re, rep] of RU_FIXES) r.name_ru = r.name_ru.replace(re, rep);
  r.name_ru = r.name_ru.replace(/\s{2,}/g, ' ').trim();
  if (r.name_ru !== orig) wordFixed++;
}
console.log(`Словарных фиксов RU: ${wordFixed}`);

// ===== Шаг 2: перепрогон строк с корейским/битыми токенами =====
const bad = rows.filter(r => {
  const en = r.name_en || '', ru = r.name_ru || '';
  return /[가-힣]/.test(en) || /[가-힣]/.test(ru);
});
console.log(`На полный перепрогон (KO→EN→RU через Bing): ${bad.length}`);

let fixed = 0, errs = 0;
const B = 10;
for (let i = 0; i < bad.length; i += B) {
  const chunk = bad.slice(i, i + B);
  try {
    // KO → EN целиком через Bing
    const resEn = await translate(chunk.map(r => r.name_ko).join('\n'), 'ko', 'en');
    const enArr = resEn.translation.split('\n');
    if (enArr.length !== chunk.length) throw new Error('línea mismatch EN');
    await new Promise(r => setTimeout(r, 300));

    // EN → RU
    const resRu = await translate(enArr.join('\n'), 'en', 'ru');
    const ruArr = resRu.translation.split('\n');
    if (ruArr.length !== chunk.length) throw new Error('mismatch RU');

    for (let j = 0; j < chunk.length; j++) {
      chunk[j].name_en = enArr[j].trim();
      let ru = ruArr[j].trim();
      for (const [re, rep] of RU_FIXES) ru = ru.replace(re, rep);
      chunk[j].name_ru = ru.replace(/\s{2,}/g, ' ').trim();
      fixed++;
    }
  } catch (e) {
    errs += chunk.length;
    console.log(`  [ERR] батч ${i / B}: ${e.message}`);
    await new Promise(r => setTimeout(r, 2000));
  }
  await new Promise(r => setTimeout(r, 300));
  if ((i / B) % 20 === 0) console.log(`  перепрогон: ${Math.min(i + B, bad.length)}/${bad.length}`);
}
console.log(`Перепрогнано: ${fixed}, ошибок: ${errs}`);

fs.writeFileSync(OUT, rows.map(r => JSON.stringify(r)).join('\n') + '\n');
console.log(`\nФайл: ${OUT}`);

// Контрольный аудит
let koEn = 0, koRu = 0;
for (const r of rows) {
  if (/[가-힣]/.test(r.name_en || '')) koEn++;
  if (/[가-힣]/.test(r.name_ru || '')) koRu++;
}
console.log(`Осталось корейского: EN=${koEn}, RU=${koRu}`);
