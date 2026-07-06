// Анализ compat-строк: нормализация, извлечение базовых моделей,
// генерационных кодов и годов. Ничего не пишет в БД.
// Выход: data/vehicles-analysis.json (+ консоль)
import fs from 'fs';

const lines = fs.readFileSync('data/partsro-images.jsonl', 'utf8').trim().split('\n');

// Собираем уникальные строки с частотой
const raw = new Map();
for (const l of lines) {
  try {
    const r = JSON.parse(l);
    if (r.status !== 'ok' || !r.compat) continue;
    for (const c of r.compat) {
      const t = c.trim();
      if (t) raw.set(t, (raw.get(t) || 0) + 1);
    }
  } catch {}
}

// --- Парсер одной строки ---
// Примеры:
//  "더 뉴 그랜저IG (2019.11-2022.11)"
//  "쏘나타 디 엣지 (DN8) (2023.4 이후)"
//  "싼타페 (SM) (1세대) (2000-2005)"
//  "팰리세이드 3.8 가솔린 (2018.12 11일-2022.5 19일)"
//  "아슬란 6단 기어"  ← мусор без годов
function parseVehicle(s) {
  let str = s.replace(/\s+/g, ' ').trim();

  // все скобочные группы
  const groups = [...str.matchAll(/\(([^)]*)\)/g)].map(m => m[1].trim());
  const base0 = str.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();

  let years = null, genCode = null, genOrdinal = null;
  const extras = [];

  for (const g of groups) {
    // годы: содержит 4-значный год
    if (/\d{4}/.test(g)) {
      years = g;
    } else if (/^\d세대$/.test(g)) {
      genOrdinal = g; // 3세대 = 3-е поколение
    } else if (/^[A-Za-z]{1,3}\d{0,2}[a-z]?$/i.test(g.replace(/\s/g, ''))) {
      genCode = g.toUpperCase(); // DN8, CN7, YP, JX1, SM...
    } else {
      extras.push(g);
    }
  }

  // нормализация годов
  let yearFrom = null, yearTo = null, open = false;
  if (years) {
    const y = years.replace(/~/g, '-').replace(/\s*이후\s*/, '-').replace(/이전/, '');
    const nums = [...y.matchAll(/(\d{4})(?:\.(\d{1,2}))?/g)];
    if (nums.length >= 1) { yearFrom = nums[0][1] + (nums[0][2] ? '.' + nums[0][2] : ''); }
    if (nums.length >= 2) { yearTo = nums[1][1] + (nums[1][2] ? '.' + nums[1][2] : ''); }
    if (/이후/.test(years) || (nums.length === 1 && /-\s*$/.test(y))) open = true;
    if (/이전/.test(years)) { yearTo = yearFrom; yearFrom = null; }
  }

  // выделяем моторные варианты из базового имени (1.4/3.8, 가솔린/디젤 и т.п.)
  let base = base0;
  const engineM = base.match(/\s(\d\.\d)(\s\d\.\d)*(\s?(가솔린|디젤|터보|LPI|LPG))?$/);
  let engine = null;
  if (engineM) {
    engine = engineM[0].trim();
    base = base.slice(0, engineM.index).trim();
  }

  // ген-код, приклеенный к имени: "그랜저IG", "투싼NX4", "그랜저HG"
  const glued = base.match(/^(.+?)([A-Z]{2}\d?|IG|HG|TG|XG|NX4|DN8|CN7|LF|NF|YF|EF)$/);
  if (glued && /[가-힣]/.test(glued[1]) && !genCode) {
    genCode = glued[2].toUpperCase();
    base = glued[1].trim();
  }

  const parsed = base && (yearFrom || yearTo || genCode);
  return { raw: s, base, genCode, genOrdinal, engine, years, yearFrom, yearTo, open, extras, parsed: !!parsed };
}

const parsed = [];
for (const [s, cnt] of raw.entries()) parsed.push({ ...parseVehicle(s), count: cnt });

// --- базовые модели с частотой ---
const models = new Map();
for (const p of parsed) {
  if (!p.base) continue;
  const m = models.get(p.base) || { count: 0, variants: 0 };
  m.count += p.count;
  m.variants += 1;
  models.set(p.base, m);
}

// --- проблемные строки ---
const dirty = parsed.filter(p => !p.parsed);

const sortedModels = [...models.entries()].sort((a, b) => b[1].count - a[1].count);

console.log(`Уникальных строк: ${raw.size}`);
console.log(`Базовых моделей: ${models.size}`);
console.log(`Не распарсилось: ${dirty.length} строк (${dirty.reduce((s, d) => s + d.count, 0)} связей)`);

fs.writeFileSync('data/vehicles-analysis.json', JSON.stringify({
  models: sortedModels.map(([name, m]) => ({ name, ...m })),
  dirty: dirty.map(d => ({ raw: d.raw, count: d.count })),
  parsed,
}, null, 1));
console.log('→ data/vehicles-analysis.json');
