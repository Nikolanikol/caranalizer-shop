// Парсер v2: compat-строки → канонический список авто.
// Ничего не пишет в БД. Выход:
//   data/vehicles-final.json    — чистый список авто
//   data/vehicles-rejected.json — отбраковка на ревью
//   data/raw-to-vehicle.json    — маппинг сырая строка → ключ авто
import fs from 'fs';
import { MODELS, PREFIXES, SUBNAMES, MODIFIERS } from './vehicle-dict.mjs';

const lines = fs.readFileSync('data/partsro-images.jsonl', 'utf8').trim().split('\n');
const raw = new Map();
for (const l of lines) {
  try {
    const r = JSON.parse(l);
    if (r.status !== 'ok' || !r.compat) continue;
    for (const c of r.compat) {
      const t = c.replace(/\s+/g, ' ').trim();
      if (t) raw.set(t, (raw.get(t) || 0) + 1);
    }
  } catch {}
}

// Модели: длинные ключи раньше (제네시스 쿠페 до 제네시스)
const modelKeys = Object.keys(MODELS).sort((a, b) => b.length - a.length);

// Ген-коды, приклеенные к хангылю: 그랜저IG, 투싼ix, LF쏘나타
const GEN_CODES = ['IG','HG','TG','XG','NF','YF','LF','EF','MD','AD','HD','CN7','DN8','NX4','JS','JM','SM','CM','DM','TM','UM','QM','MQ4','NQ5','SK3','JA','YB','OS','SX2','AX1','GL3','CK','BH','DH','RG3','JX1','JK1','US4','KA4','YG','VG','TF','JF','DL3','SW','FE','GB','PD','CN','VI','ix','R','II','2','TL','FS','IK','RS4','RJ','FD','GD','JD','PDE','LX2','QL','MX5','SU2','ON','GN7','LX3','XD','SX','HM','IX','HR','FC','SG2','CV','MV','GC','WK','DM8'];

// токены, которые просто выбрасываем
const DROP_TOKENS = new Set(['연식무관', '젠쿱', '전차종', '차량', '이상', '이하']);

function parseYears(str) {
  // возвращает {yearFrom, yearTo, open} или null
  const y = str.replace(/~/g, '-');
  const nums = [...y.matchAll(/(\d{4})(?:\.(\d{1,2}))?/g)];
  if (!nums.length) return null;
  const fmt = (m) => m[1] + (m[2] ? '.' + m[2] : '');
  let yearFrom = fmt(nums[0]), yearTo = nums.length > 1 ? fmt(nums[1]) : null, open = false;
  if (/이후/.test(str)) open = true;               // "2019 이후" = с 2019
  if (/이전/.test(str)) { yearTo = yearFrom; yearFrom = null; } // "2006.10 이전" = до
  return { yearFrom, yearTo, open };
}

function parseOne(s) {
  let work = s.replace(/8X410X4/g, '8X4/10X4'); // склеенная осевая формула
  const result = { raw: s, modifiers: [], noteMods: [], subnames: [], genCode: null, genOrdinal: null, axle: null };

  // модельный год в имени: "카니발 2005년식", ведущий "2024 더 뉴 아반떼N"
  const myM = work.match(/(\d{4})년식/);
  if (myM) { result.subnames.push('MY' + myM[1]); work = work.replace(myM[0], ' '); }
  const leadYear = work.match(/^(20\d\d)\s+(?=[가-힣A-Za-z])/);
  if (leadYear) { result.leadYear = leadYear[1]; work = work.replace(leadYear[0], ''); }

  // суффикс N (performance): "아반떼N", "코나N", "벨로스터 N"
  if (/[가-힣]N(?=\s|$|\s*\()/.test(work) || /\sN(?=\s|$|\s*\()/.test(work)) {
    result.subnames.push('N');
    work = work.replace(/(?<=[가-힣])N(?=\s|$)/, '').replace(/\sN(?=\s|$)/, ' ');
  }

  // скобочные группы
  const groups = [...work.matchAll(/\(([^)]*)\)/g)].map(m => m[1].trim());
  work = work.replace(/\([^)]*\)/g, ' ');

  for (const g of groups) {
    if (/\d{4}/.test(g)) { Object.assign(result, parseYears(g) || {}); continue; }
    const ord = g.match(/^(\d)세대$/);
    if (ord) { result.genOrdinal = parseInt(ord[1], 10); continue; }
    const code = g.replace(/\s/g, '');
    if (/^\d?[A-Za-z]{1,3}\d{0,2}[a-z]?$/i.test(code)) { result.genCode = code.replace(/^\d(?=[A-Za-z]{2})/, '').toUpperCase(); continue; }
    if (MODIFIERS[g]) { pushMod(result, g); continue; }
    // пословный перевод группы: "(2.0 가솔린)", "(전기차 EV)", "(페이스리프트)"
    for (const w of g.split(/\s+/)) {
      if (!w || DROP_TOKENS.has(w)) continue;
      if (MODIFIERS[w]) { pushMod(result, w); continue; }
      if (SUBNAMES[w]) { result.subnames.push(SUBNAMES[w]); continue; }
      if (/^\d\.\d$/.test(w)) { result.noteMods.push(w); continue; }
      const myW = w.match(/^(\d{2,4})년[식형]?$/);
      if (myW) { result.subnames.push('MY' + myW[1]); continue; }
      if (w === 'EV') { if (!result.modifiers.includes('EV')) result.modifiers.push('EV'); continue; }
      result.subnames.push(w); // неизвестный токен — в имя как есть
    }
  }

  // годы вне скобок (кривые строки "쎄라토 2003.11-2006.6)")
  if (!result.yearFrom && !result.yearTo) {
    const ym = work.match(/(\d{4})(\.\d{1,2})?\s*[-~]\s*(\d{4})(\.\d{1,2})?/);
    if (ym) { Object.assign(result, parseYears(ym[0]) || {}); work = work.replace(ym[0], ' '); }
  }
  // "카니발 2005년식" / "봉고3 2017" — одиночный год
  if (!result.yearFrom && !result.yearTo) {
    const my = work.match(/(\d{4})\s*년식?|(?<=\s)(\d{4})(?=\s|$)/);
    if (my) {
      const yy = my[1] || my[2];
      if (yy >= '1980' && yy <= '2027') { result.yearFrom = yy; result.yearTo = yy; work = work.replace(my[0], ' '); }
    }
    // "봉고3/프레지오 96" — двухзначный год
    const my2 = work.match(/(?<=\s)(9\d|0\d)(?=\s|$)/);
    if (!result.yearFrom && my2) { const yy = (my2[1][0] === '9' ? '19' : '20') + my2[1]; result.yearFrom = yy; result.yearTo = yy; work = work.replace(my2[0], ' '); }
    // ведущий год "2024 더 뉴 아반떼N"
    if (!result.yearFrom && result.leadYear) { result.yearFrom = result.leadYear; result.open = true; }
  }

  // осевые формулы грузовиков (в т.ч. "8X4/10X4", "8X4 10X4")
  const axle = work.match(/\b(\d+X\d+(?:[\s/]+\d+X\d+)*)\b/i);
  if (axle) { result.axle = axle[1].toUpperCase().replace(/\s+/g, '/'); work = work.replace(axle[0], ' '); }

  // слово "기아" (бренд Kia в имени)
  work = work.replace(/(?<=^|\s)기아(?=\s|$)/, ' ');

  // одиночный "EV" в тексте → модификатор
  if (/\bEV\b/.test(work)) { if (!result.modifiers.includes('EV')) result.modifiers.push('EV'); work = work.replace(/\bEV\b/g, ' '); }

  // остаточные диапазоны/даты в тексте (годы уже взяты из скобок)
  if (result.yearFrom || result.yearTo) {
    work = work.replace(/\d{4}(\.\d{1,2})?\s*[-~]\s*(\d{4}(\.\d{1,2})?)?\)?/g, ' ');
    work = work.replace(/[A-Z]{3}\.\d{4}-?/g, ' ').replace(/:\s/g, ' ');
    const myTail = work.match(/(?<=\s)((?:19|20)\d\d)(?=\s|$)/);
    if (myTail) { result.subnames.push('MY' + myTail[1]); work = work.replace(myTail[0], ' '); }
    const my2Tail = work.match(/(?<=\s)(0\d|1\d|9\d)(?=\s|$)/);
    if (my2Tail) { result.subnames.push('MY' + my2Tail[1]); work = work.replace(my2Tail[0], ' '); }
  }

  // "1세대" вне скобок
  const ordT = work.match(/(\d)세대/);
  if (ordT) { result.genOrdinal = result.genOrdinal || parseInt(ordT[1], 10); work = work.replace(ordT[0], ' '); }

  // мусорные скобки/остатки: "쎄라토 )", "LPi", "500h"
  work = work.replace(/[()]/g, ' ');
  if (/\bLPi\b/i.test(work)) { result.noteMods.push('LPI'); work = work.replace(/\bLPi\b/i, ' '); }
  const hM = work.match(/\b(\d{3}h)\b/);
  if (hM) { result.noteMods.push(hM[1]); work = work.replace(hM[0], ' '); }

  // модификаторы в тексте
  for (const mod of Object.keys(MODIFIERS).sort((a, b) => b.length - a.length)) {
    if (work.includes(mod)) { pushMod(result, mod); work = work.replaceAll(mod, ' '); }
  }

  // моторные объёмы: "3.0 3.3", "1.6" → в note
  const eng = [...work.matchAll(/\b\d\.\d\b/g)].map(m => m[0]);
  if (eng.length) { result.noteMods.push(...eng); work = work.replace(/\b\d\.\d\b/g, ' '); }

  // префикс
  result.prefix = null;
  work = work.replace(/\s+/g, ' ').trim();
  for (const [ko, en] of PREFIXES) {
    if (work.startsWith(ko + ' ') || work.startsWith(ko)) {
      // осторожно: "뉴" не должен съесть "뉴라이즈"
      const rest = work.slice(ko.length).trim();
      if (ko === '뉴' && /^라이즈/.test(rest)) continue;
      result.prefix = en; work = rest; break;
    }
  }

  // точное совпадение со словарём ДО чистки сабнеймов ("에어로 퀸/익스프레스")
  work = work.replace(/\s+/g, ' ').trim();
  if (MODELS[work]) {
    const model = MODELS[work];
    result.modelKo = work; result.brand = model.brand;
    const parts = [];
    if (result.prefix) parts.push(result.prefix);
    parts.push(model.en);
    for (const sub of result.subnames) parts.push(sub);
    if (result.genCode) parts.push(result.genCode);
    if (result.genOrdinal) parts.push(`Gen ${result.genOrdinal}`);
    if (result.axle) parts.push(result.axle);
    for (const m of result.modifiers) parts.push(m);
    result.nameEn = parts.join(' ').replace(/\s+/g, ' ').trim();
    return result;
  }

  // сабнеймы из текста
  for (const sub of Object.keys(SUBNAMES).sort((a, b) => b.length - a.length)) {
    if (work.includes(sub)) { result.subnames.push(SUBNAMES[sub]); work = work.replaceAll(sub, ' '); }
  }

  work = work.replace(/(?<=^|\s)[-:/]+(?=\s|$)/g, ' ').replace(/\s+/g, ' ').trim();

  // приклеенный ген-код: "그랜저IG" "LF쏘나타" "투싼ix" "포터2" "봉고3"
  let modelKo = null;
  const tryMatch = (str) => modelKeys.find(k => str === k || str.startsWith(k + ' ') || str === k);

  // прямое совпадение
  for (const k of modelKeys) {
    if (work === k) { modelKo = k; work = ''; break; }
    if (work.startsWith(k)) {
      const tail = work.slice(k.length).trim();
      // хвост = ген-код / цифра поколения / пусто?
      const tailCode = tail.replace(/\s/g, '');
      if (!tail) { modelKo = k; work = ''; break; }
      if (GEN_CODES.includes(tailCode) || /^\d$/.test(tailCode)) {
        modelKo = k;
        result.genCode = result.genCode || (/^\d$/.test(tailCode) ? null : tailCode.toUpperCase());
        if (/^\d$/.test(tailCode)) result.numSuffix = tailCode; // 포터2, 봉고3
        work = ''; break;
      }
      // "LF쏘나타" — код спереди
    }
    // код спереди: LF쏘나타, NF쏘나타, YF쏘나타, EF 쏘나타
    const frontM = work.match(new RegExp('^([A-Za-z]{1,3})\\s?' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
    if (frontM && GEN_CODES.includes(frontM[1].toUpperCase())) {
      modelKo = k; result.genCode = result.genCode || frontM[1].toUpperCase(); work = ''; break;
    }
  }

  // "N톤 트럭" / "N톤 슈퍼트럭" — грузовики по тоннажу
  if (!modelKo) {
    const ton = work.match(/^(\d+(?:\.\d+)?)톤\s*(슈퍼트럭|트럭)$/);
    if (ton) {
      result.modelKo = work; result.brand = 'hyundai';
      result.nameEn = `${ton[1]}-ton ${ton[2] === '슈퍼트럭' ? 'Super Truck' : 'Truck'}`;
      if (result.modifiers.length) result.nameEn += ' ' + result.modifiers.join(' ');
      return result;
    }
  }

  if (!modelKo) return { ...result, rejected: true, leftover: work };

  const model = MODELS[modelKo];
  result.modelKo = modelKo;
  result.brand = model.brand;

  // компоновка EN-имени
  const parts = [];
  if (result.prefix) parts.push(result.prefix);
  parts.push(model.en + (result.numSuffix ? ' ' + result.numSuffix : ''));
  for (const sub of result.subnames) parts.push(sub);
  if (result.genCode) parts.push(result.genCode);
  if (result.genOrdinal) parts.push(`Gen ${result.genOrdinal}`);
  if (result.axle) parts.push(result.axle);
  for (const m of result.modifiers) parts.push(m);
  result.nameEn = parts.join(' ').replace(/\s+/g, ' ').trim();

  return result;
}

function pushMod(result, ko) {
  const en = MODIFIERS[ko];
  // моторные/трансмиссионные → в note, идентичность авто не меняют
  if (['Diesel', 'Gasoline', 'LPI', 'LPG', 'Turbo', 'Manual', 'Auto'].includes(en)) result.noteMods.push(en);
  else result.modifiers.push(en);
}

// === прогон ===
const vehicles = new Map(); // key → vehicle
const rawToVehicle = {};
const rejected = [];

for (const [s, cnt] of raw.entries()) {
  const p = parseOne(s);
  if (p.rejected) { rejected.push({ raw: s, count: cnt, leftover: p.leftover }); continue; }

  const iy = (v) => v ? parseInt(v) : '';
  const key = [p.brand, p.nameEn, iy(p.yearFrom), iy(p.yearTo), p.open ? 'open' : ''].join('|');

  const ex = vehicles.get(key);
  if (ex) {
    ex.count += cnt;
    // предпочитаем более точные годы (с месяцем)
    if (p.yearFrom && String(p.yearFrom).includes('.') && !String(ex.year_from || '').includes('.')) ex.year_from = p.yearFrom;
    if (p.yearTo && String(p.yearTo).includes('.') && !String(ex.year_to || '').includes('.')) ex.year_to = p.yearTo;
    ex.raw_variants.push(s);
  } else {
    vehicles.set(key, {
      key, brand: p.brand, model_ko: p.modelKo, name_en: p.nameEn,
      gen_code: p.genCode, year_from: p.yearFrom || null, year_to: p.yearTo || null,
      open_ended: !!p.open, count: cnt, raw_variants: [s],
    });
  }
  rawToVehicle[s] = key;
}

const list = [...vehicles.values()].sort((a, b) => b.count - a.count);
const rejLinks = rejected.reduce((s, r) => s + r.count, 0);
const totLinks = [...raw.values()].reduce((s, v) => s + v, 0);

console.log(`Уникальных строк: ${raw.size}`);
console.log(`Канонических авто: ${list.length}`);
console.log(`Отбраковано: ${rejected.length} строк (${rejLinks} связей из ${totLinks} = ${(rejLinks / totLinks * 100).toFixed(1)}%)`);

fs.writeFileSync('data/vehicles-final.json', JSON.stringify(list, null, 1));
fs.writeFileSync('data/vehicles-rejected.json', JSON.stringify(rejected.sort((a, b) => b.count - a.count), null, 1));
fs.writeFileSync('data/raw-to-vehicle.json', JSON.stringify(rawToVehicle, null, 1));
console.log('→ data/vehicles-final.json, vehicles-rejected.json, raw-to-vehicle.json');
