/**
 * Заголовок и описание диска — собираются из полей, а не берутся у донора.
 *
 * Описание в объявлении донора существует у всех ста двадцати позиций, но публиковать
 * его нельзя: это объявление чужой розницы. Внутри реклама собственных точек SkyWheel,
 * скидка за упоминание их доски, цена за наличные против карты с НДС и цена trade-in —
 * условия, которых мы не даём и выполнить не можем.
 *
 * Поэтому здесь тот же приём, что у заголовка детали в partsfit: текст собирается
 * из перечислимых полей. Он выходит двуязычным сразу, не тащит на сайт чужих обещаний
 * и не устаревает при следующем скрапе.
 *
 * Правило формулировок то же, что у таблицы совместимости: марка и модель у кованого
 * афтермаркета — это **наблюдение о совместимости, а не происхождение**. SW-15 подходит
 * и к BMW M3, и к F-серии, и к Kia Carnival. За слово «подходит» отвечаем мы,
 * и первый же возврат будет по нашей вине.
 */

import type { ShopLocale } from './terms';
import type { Wheel, WheelKind, WheelQuantity } from '@/types/wheel';

const KIND: Record<Exclude<WheelKind, ''>, Record<ShopLocale, string>> = {
  forged: { ru: 'Кованые диски', en: 'Forged wheels' },
  restored: { ru: 'Восстановленные диски', en: 'Refurbished wheels' },
  oem: { ru: 'Оригинальные диски', en: 'Original wheels' },
  'diamond-cut': { ru: 'Диски с алмазной проточкой', en: 'Diamond-cut wheels' },
};

const QUANTITY: Record<Exclude<WheelQuantity, ''>, Record<ShopLocale, string>> = {
  set: { ru: 'Продаётся комплектом из четырёх.', en: 'Sold as a set of four.' },
  single: { ru: 'Продаётся поштучно — один диск.', en: 'Sold individually — a single wheel.' },
};

/**
 * Марки, которые делают диски, а не машины.
 *
 * Различать обязательно. У остальных позиций марка — это машина, на которой диск
 * встречается, и текст строится вокруг неё: «R19, встречается на Genesis G80».
 * У кованого афтермаркета марка — производитель самого диска, и та же фраза даёт
 * «встречается на SkyWheel», то есть бессмыслицу. Вылезло на первой же сборке витрины.
 *
 * Список короткий и закрытый: он повторяет марки-производители из словаря скрапера
 * (`scripts/skywheel/dict.mjs`). Появится ещё одна — дописать сюда, иначе она молча
 * поедет на витрину как марка автомобиля.
 */
const WHEEL_MAKERS = new Set(['skywheel', 'bbs', 'weds']);

/** Марка делает диски, а не машины — подписи вокруг неё строятся иначе. */
export const isWheelMaker = (brandSlug: string): boolean => WHEEL_MAKERS.has(brandSlug);

const pick = (locale: ShopLocale, pair: Record<ShopLocale, string>) => pair[locale];

/** «19"» по-английски и «R19» по-русски — так размер пишут в каждом языке. */
const size = (diameter: number, locale: ShopLocale) =>
  locale === 'ru' ? `R${diameter}` : `${diameter}″`;

/**
 * Заголовок: тип диска, марка, модель, диаметр. Модель может отсутствовать —
 * у афтермаркета её нет, и подставлять туда марку нельзя.
 */
export function wheelTitle(wheel: Wheel, locale: ShopLocale): string {
  const kind = wheel.wheelKind
    ? pick(locale, KIND[wheel.wheelKind])
    : locale === 'ru'
      ? 'Диски'
      : 'Wheels';
  const car = [wheel.brandName, wheel.model].filter(Boolean).join(' ');
  return [kind, car, size(wheel.diameter, locale)].filter(Boolean).join(' ');
}

/**
 * Описание. Только факты о товаре: название, марка или производитель, модель
 * и характеристики, если продавец их назвал.
 *
 * Чего здесь намеренно НЕТ (убрано 29.08.2026, решение владельца):
 *
 *   - **оговорок про неизвестные параметры.** Строка «разболтовку и вылет продавец
 *     не указал — уточним по запросу» стояла у семи товаров из восьми и превращала
 *     описание в извинение. Нет параметров — молчим, у товара остаётся название,
 *     марка и диаметр.
 *   - **пояснений про тип диска.** «Кованый диск легче литого при той же прочности» —
 *     это реклама, а не факт о товаре, и тип уже назван в заголовке.
 *   - **состояния и грейда.** Они не проза: показываются плашкой на карточке
 *     и строкой в таблице характеристик, а в описании только удлиняли текст.
 *
 * Комплектность и шины остались: это характеристики того, что продаётся. Комплектность
 * особенно — цена комплекта и штуки отличается вчетверо, и молчать о ней там,
 * где продавец её назвал, нельзя.
 */
export function wheelDescription(wheel: Wheel, locale: ShopLocale): string {
  const lines: string[] = [];
  const ru = locale === 'ru';

  const madeBy = WHEEL_MAKERS.has(wheel.brandSlug);
  const car = madeBy ? '' : [wheel.brandName, wheel.model].filter(Boolean).join(' ');

  if (madeBy) {
    lines.push(
      ru
        ? `${size(wheel.diameter, 'ru')}, производитель ${wheel.brandName}.`
        : `${size(wheel.diameter, 'en')}, made by ${wheel.brandName}.`,
    );
  } else if (car) {
    // «Встречается на», а не «подходит к»: марка и модель приходят из объявления
    // донора — это наблюдение, а не подтверждение завода, и отвечать за слово
    // «подходит» нам.
    lines.push(
      ru
        ? `${size(wheel.diameter, 'ru')}, встречается на ${car}.`
        : `${size(wheel.diameter, 'en')}, found on ${car}.`,
    );
  } else {
    lines.push(ru ? `Диаметр ${size(wheel.diameter, 'ru')}.` : `Diameter ${size(wheel.diameter, 'en')}.`);
  }

  if (wheel.quantity) lines.push(pick(locale, QUANTITY[wheel.quantity]));

  if (wheel.withTyres) {
    lines.push(
      ru
        ? `Продаётся с шинами${wheel.tyre ? ` ${wheel.tyre}` : ''}.`
        : `Sold with tyres${wheel.tyre ? ` ${wheel.tyre}` : ''}.`,
    );
  }

  const specs = wheelSpecs(wheel, locale);
  if (specs) lines.push(specs);

  return lines.join(' ');
}

/** Строка параметров: ширина, PCD, вылет, ступица — только то, что донор назвал. */
export function wheelSpecs(wheel: Wheel, locale: ShopLocale): string {
  const parts: string[] = [];
  const ru = locale === 'ru';

  if (wheel.widthJ.length) parts.push(`${ru ? 'ширина' : 'width'} ${wheel.widthJ.join('/')}J`);
  if (wheel.pcd.length) parts.push(`PCD ${wheel.pcd.join('×')}`);
  if (wheel.offsetEt.length) parts.push(`ET ${wheel.offsetEt.join('/')}`);
  if (wheel.boreCb) parts.push(`${ru ? 'ступица' : 'bore'} ${wheel.boreCb}`);

  if (!parts.length) return '';
  return `${ru ? 'Параметры' : 'Specs'}: ${parts.join(', ')}.`;
}
