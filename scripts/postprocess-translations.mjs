import fs from 'fs';

const IN = 'data/translations.jsonl';
const OUT = 'data/translations_fixed.jsonl';

// Замены в RU: [regex, замена]
// \b не работает с кириллицей в JS, поэтому lookaround
const cyr = 'а-яА-ЯёЁ';
const wb = (w) => new RegExp(`(?<![${cyr}])${w}(?![${cyr}])`, 'g');

const RU_FIXES = [
  // HTML-сущности и артефакты &amp;
  [/\s*и усилитель;\s*/g, ' и '],
  [/\s*&\s*усилитель;\s*/g, ' и '],
  [/усилитель;\s*/g, ''],
  [/&amp;/g, '&'],
  // Автомобильный контекст
  [wb('Кепка'), 'Крышка'], [wb('кепка'), 'крышка'], [wb('Кепку'), 'Крышку'],
  [wb('Член'), 'Лонжерон'], [wb('член'), 'лонжерон'],
  [wb('Члена'), 'Лонжерона'], [wb('члена'), 'лонжерона'],
  [wb('Члену'), 'Лонжерону'], [wb('члену'), 'лонжерону'],
  [wb('Членом'), 'Лонжероном'], [wb('членом'), 'лонжероном'],
  [/\s*и amp;\s*/g, ' и '], [/\s*amp;\s*/g, ' '],
  [/членского центра/g, 'центрального лонжерона'],
  [/&quot;/g, '"'],
  [wb('Тюлень'), 'Уплотнитель'], [wb('тюлень'), 'уплотнитель'], [wb('Тюленя'), 'Уплотнителя'],
  [wb('Рамка'), 'Рама'], [wb('рамка'), 'рама'],
  [/[Хх]востовые ворота/g, 'дверь багажника'],
  [/[Хх]востовых ворот/g, 'двери багажника'],
  [wb('Оставайся'), 'Упор'], [wb('оставайся'), 'упор'],
  [wb('Весна'), 'Пружина'], [wb('весна'), 'пружина'],
  [/Весенний переворот/g, 'Пружина перекидная'],
  [/Жилищное собрание/g, 'Корпус в сборе'],
  [/Кавер-рокер/g, 'Крышка коромысел'],
  [wb('Клип'), 'Зажим'], [wb('клип'), 'зажим'],
  [wb('Обложка'), 'Крышка'], [wb('обложка'), 'крышка'],
];

const EN_FIXES = [
  [/&amp;/g, '&'],
  [/&quot;/g, '"'],
];

const lines = fs.readFileSync(IN, 'utf8').trim().split('\n');
let changed = 0;
const out = [];

for (const line of lines) {
  const r = JSON.parse(line);
  const origRu = r.name_ru;
  const origEn = r.name_en;

  if (r.name_ru) {
    for (const [re, rep] of RU_FIXES) r.name_ru = r.name_ru.replace(re, rep);
    r.name_ru = r.name_ru.replace(/\s{2,}/g, ' ').trim();
  }
  if (r.name_en) {
    for (const [re, rep] of EN_FIXES) r.name_en = r.name_en.replace(re, rep);
    r.name_en = r.name_en.replace(/\s{2,}/g, ' ').trim();
  }

  if (r.name_ru !== origRu || r.name_en !== origEn) changed++;
  out.push(JSON.stringify(r));
}

fs.writeFileSync(OUT, out.join('\n') + '\n');
console.log(`Всего: ${lines.length}`);
console.log(`Исправлено: ${changed}`);
console.log(`Файл: ${OUT}`);
