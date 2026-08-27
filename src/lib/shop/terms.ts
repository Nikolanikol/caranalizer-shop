/**
 * Словарь каталога: русский термин донора → английский.
 *
 * Каталог приходит от донора по-корейски и раскладывается скрапером в русские термины
 * по закрытым словарям (`scripts/partsfit/`). Английская витрина не переводит текст —
 * она переводит **эти же термины**, потому что свободной прозы в данных нет вовсе:
 * заголовок собирается из типа детали, марки, модели и года, а состояние, тип лампы,
 * комплектность и опции приходят из перечислимых наборов.
 *
 * Отсюда размер задачи: 49 терминов и 11 типов деталей, а не 18 655 переводов.
 *
 * **Наборы закрытые, и это надо удержать.** Появится у донора новая группа — появятся
 * новые термины, и они молча поедут на английскую витрину по-русски. Поэтому есть
 * `npm run partsfit:terms` — он сверяет словарь с тем, что реально лежит в данных,
 * и печатает непокрытое. Гонять после каждого нового скрапа.
 *
 * Марки, модели и коды цвета кузова не переводятся: они и в данных латиницей.
 */

/** Языки раздела запчастей. Каталог одноязычный по данным, но подписи двуязычны. */
export type ShopLocale = 'ru' | 'en';

/** Состояние экземпляра — `condition_ru` из `partsfit_offers`. */
export const CONDITION_EN: Record<string, string> = {
  'Дефектов не отмечено': 'No defects noted',
  'Хорошее состояние': 'Good condition',
  'Есть царапины или потёртости': 'Scratches or scuffs',
  'Есть повреждение': 'Damaged',
};

/**
 * Заметки о дефектах — `condition_notes`. Переводим ровно так же осторожно, как писали
 * по-русски: «работает исправно» остаётся со ссылкой на слова донора, а не становится
 * нашим обещанием.
 */
export const CONDITION_NOTES_EN: Record<string, string> = {
  'Смотрите фотографии': 'See the photos',
  'царапины': 'scratches',
  'трещина, скол или поломка': 'crack, chip or breakage',
  'мелкие бытовые царапины': 'minor everyday scratches',
  'Работоспособность проверена донором': 'Tested by the salvage yard',
  'помутнение или пожелтение стекла': 'clouded or yellowed lens',
  'неисправность': 'fault',
  'загрязнение или следы влаги внутри': 'dirt or moisture inside',
  'Партномер сверьте по фотографиям': 'Check the part number against the photos',
  'Перед отправкой донор полирует и покрывает стекло':
    'The salvage yard polishes and coats the lens before dispatch',
  'облезло покрытие или лак': 'peeling coating or lacquer',
  'Работает исправно (со слов донора)': 'Works properly (per the salvage yard)',
  'часть детали снята': 'part of the item removed',
  'требуется ремонт или окраска': 'repair or repainting required',
  'вмятина': 'dent',
  'деталь восстанавливали': 'the item has been refurbished',
  'На работу не влияет': 'Does not affect operation',
};

/** Тип лампы — только у оптики. */
export const LAMP_TYPE_EN: Record<string, string> = {
  'Светодиодная': 'LED',
  'Полностью светодиодная': 'Full LED',
  'Матричная светодиодная': 'Matrix LED',
  'Ксеноновая (HID)': 'Xenon (HID)',
  'Галогеновая': 'Halogen',
  'Адаптивная': 'Adaptive',
};

/** Комплектность: что именно приедет — узел целиком или корпус. */
export const COMPLETENESS_EN: Record<string, string> = {
  'В сборе': 'Complete assembly',
  'С модулем': 'With module',
  'Без модуля': 'Without module',
  'С блоком розжига': 'With ballast',
  'Только корпус, без модуля': 'Housing only, no module',
};

/** Опции экземпляра. */
export const FEATURES_EN: Record<string, string> = {
  'С повторителем поворота': 'With turn signal repeater',
  'С камерой': 'With camera',
  'С датчиком слепых зон': 'With blind spot sensor',
  'С подсветкой под зеркалом': 'With puddle light',
  'С электроскладыванием': 'With power folding',
  'С электроприводом': 'With power adjustment',
  'Механическое': 'Manual',
  'С автозатемнением': 'With auto-dimming',
  'С памятью положения': 'With position memory',
  'С дневными ходовыми огнями': 'With daytime running lights',
  'Без разъёма-косички': 'No pigtail connector',
  'С обогревом': 'With heating',
  'С автокорректором': 'With auto-levelling',
};

/** Сторона детали. Буквы LH/RH международные — их и оставляем. */
export const SIDE_EN: Record<string, string> = {
  'Левый (LH)': 'Left (LH)',
  'Правый (RH)': 'Right (RH)',
};

/** Позиция — только у задних фонарей: часть стоит в крыле, часть в крышке багажника. */
export const POSITION_EN: Record<string, string> = {
  'Внешний (в крыло)': 'Outer (fender)',
  'Внутренний (в крышку багажника)': 'Inner (tailgate)',
};

/**
 * Типы деталей по-английски: заголовок и множественное число.
 *
 * Ключи — сегменты адреса, те же, что у `CATEGORIES` в `catalog.ts`. Описания категорий
 * сюда не входят намеренно: это маркетинговая копия под русский поиск, и переводить её
 * дословно незачем — английские описания пишутся заново, когда до лендингов дойдут руки.
 * Сейчас английскому покупателю нужен не текст, а понятное имя типа детали рядом
 * с артикулом.
 */
export const CATEGORY_EN: Record<string, { title: string; plural: string }> = {
  'perednie-fary': { title: 'Headlight', plural: 'Headlights' },
  'zadnie-fonari': { title: 'Tail Light', plural: 'Tail Lights' },
  'protivotumannye-fary': { title: 'Fog Light', plural: 'Fog Lights' },
  'bokovye-zerkala': { title: 'Side Mirror', plural: 'Side Mirrors' },
  'blok-komforta-bcm': { title: 'Body Control Module (BCM)', plural: 'Body Control Modules' },
  'blok-upravleniya-dvigatelem': { title: 'Engine Control Unit (ECU)', plural: 'Engine Control Units' },
  'blok-upravleniya-akpp': { title: 'Transmission Control Unit (TCU)', plural: 'Transmission Control Units' },
  'blok-abs': { title: 'ABS Module', plural: 'ABS Modules' },
  'elektronnye-bloki': { title: 'Electronic Module', plural: 'Electronic Modules' },
  'nakladka-zadney-paneli': { title: 'Rear Panel Trim', plural: 'Rear Panel Trims' },
  'obshivka-dveri-bagazhnika': { title: 'Tailgate Trim', plural: 'Tailgate Trims' },
};

/**
 * Все словари разом — для проверки полноты. Порядок соответствует полям данных,
 * имена совпадают с колонками, чтобы отчёт о непокрытом читался без расшифровки.
 */
export const TERM_MAPS: Record<string, Record<string, string>> = {
  condition_ru: CONDITION_EN,
  condition_notes: CONDITION_NOTES_EN,
  lamp_type_ru: LAMP_TYPE_EN,
  completeness_ru: COMPLETENESS_EN,
  features_ru: FEATURES_EN,
  side: SIDE_EN,
  position: POSITION_EN,
};

/**
 * Перевод одного термина.
 *
 * Непокрытый термин возвращается **как есть, по-русски**, а не пустой строкой:
 * английский покупатель скорее разберёт кириллицу рядом с фотографией, чем поймёт
 * пустое место. Дыру ловит `partsfit:terms`, а не витрина.
 */
export function term(value: string, locale: ShopLocale, map: Record<string, string>): string {
  if (locale === 'ru' || !value) return value;
  return map[value] ?? value;
}

/** То же для списков — заметки о дефектах и опции приходят массивами. */
export function terms(values: string[], locale: ShopLocale, map: Record<string, string>): string[] {
  if (locale === 'ru') return values;
  return values.map((value) => term(value, locale, map));
}
