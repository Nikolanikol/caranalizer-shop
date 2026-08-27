import type { ShopLocale } from './terms';

/**
 * Тексты посадочных страниц: категория, марка, модель.
 *
 * Шаблоны одинаковы у всех трёх, и раньше они стояли прямо в страницах. С двумя языками
 * это дало бы шесть копий одного предложения в трёх файлах — и первая же правка формулировки
 * разошлась бы. Поэтому шаблон один, а страница передаёт в него имена.
 *
 * Описания категорий по-английски не переводятся дословно с русских: те написаны под
 * русские поисковые запросы, где важны «оригинальные» и «б/у». Английские собираются
 * из множественного числа типа детали — короче и без обещаний, которых мы не давали.
 */

export interface Copy {
  title: string;
  description: string;
  heading: string;
  intro: string;
}

/** Категория: «Задние фонари из Южной Кореи». */
export function categoryCopy(
  locale: ShopLocale,
  plural: string,
  descriptionRu: string,
): Copy {
  if (locale === 'en') {
    return {
      title: `${plural} from South Korea`,
      description: `Used ${plural.toLowerCase()} from South Korean salvage yards. Search by OEM number, make and model, photos of every item, worldwide shipping.`,
      heading: plural,
      intro: `Used ${plural.toLowerCase()} pulled from cars at South Korean salvage yards. Every photo shows the exact item you will receive.`,
    };
  }

  return {
    title: `${plural} из Южной Кореи`,
    description: descriptionRu,
    heading: plural,
    intro: descriptionRu,
  };
}

/** Марка: «Задние фонари BMW». */
export function brandCopy(locale: ShopLocale, plural: string, brand: string): Copy {
  const subject = `${plural} ${brand}`;
  if (locale === 'en') {
    return {
      title: `${subject} — used, from Korea`,
      description: `${subject} from South Korean salvage yards. Search by OEM number and model, photos of every item, worldwide shipping.`,
      heading: subject,
      intro: `${subject} from South Korean salvage yards. Every photo shows the exact item you will receive. Pick a model to narrow the list.`,
    };
  }

  return {
    title: `${subject} — оригинал из Кореи`,
    description: `${subject} с авторазборок Южной Кореи. Поиск по OEM-артикулу и модели, фотографии каждой детали, доставка по России.`,
    heading: subject,
    intro: `${subject} с авторазборок Южной Кореи. Все фотографии — того самого товара, который приедет. Выберите модель, чтобы сузить подборку.`,
  };
}

/**
 * Модель: «Задний фонарь BMW 5 Series».
 *
 * Отдельная ветка на случай, когда донор модель не указал: страница существует, чтобы
 * товар не остался без родителя, но заголовок и текст у неё про марку целиком.
 */
export function modelCopy(
  locale: ShopLocale,
  args: { plural: string; title: string; brand: string; model: string },
): Copy {
  const { plural, title, brand, model } = args;
  const full = model ? `${brand} ${model}` : brand;

  if (locale === 'en') {
    return {
      title: `${title} ${full} — used, from Korea`,
      description: `${plural} ${full} from South Korean salvage yards. Search by OEM number, photos of every item, worldwide shipping.`,
      heading: `${plural} ${full}`,
      intro: model
        ? `${plural} ${full} from South Korean salvage yards. Check the item against the photos and the OE number — the photos show exactly what will arrive.`
        : `${plural} ${brand} where the salvage yard did not state the model. Check against the photos and the OE number.`,
    };
  }

  return {
    title: `${title} ${full} — оригинал из Кореи`,
    description: `${plural} ${full} с авторазборок Южной Кореи. Поиск по OEM-артикулу, фотографии каждой детали, доставка по России.`,
    heading: `${plural} ${full}`,
    intro: model
      ? `${plural} ${full} с авторазборок Южной Кореи. Сверьте деталь по фотографиям и OE-номеру — фото показывают именно тот товар, который приедет.`
      : `${plural} ${brand}, у которых донор не указал модель. Сверяйте по фотографиям и OE-номеру.`,
  };
}
