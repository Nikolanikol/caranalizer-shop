/**
 * Мост из диска в корзину.
 *
 * Корзина одна на весь раздел и хранит снимок товара в виде `AutoPart`. Заводить ей
 * второй тип позиции значило бы переписать самый денежный клиентский компонент ради
 * полей, которые она использует как подписи. Поэтому диск приводится к тому же снимку
 * здесь, на границе, — а не притворяется деталью в слое данных.
 *
 * Файл клиентский по назначению (его зовёт кнопка «в корзину»), поэтому без
 * `server-only` и без импорта `wheels.ts`.
 */

import type { AutoPart } from '@/types/part';
import type { Wheel } from '@/types/wheel';
import type { ShopLocale } from './terms';
import { wheelCartId } from './urls';
import { wheelTitle } from './wheels-text';

/**
 * Снимок диска для корзины.
 *
 * Три поля заслуживают внимания:
 *
 * `id` — с префиксом `wheel-`. По нему сервер дочитывает цену из базы, и пространства
 * имён двух доноров обязаны быть разведены: у обоих ключ числовая строка, и совпадение
 * означало бы счёт по цене чужого товара.
 *
 * `titleRu` — русский, независимо от языка покупателя: заявку в Telegram читает
 * русскоязычный менеджер. Ровно то же правило, что у детали.
 *
 * `oemNumber` — пустая строка, и это не потеря. У диска партномера нет вовсе; менеджеру
 * позицию опознавать по ссылке, которая уезжает в заявку рядом.
 */
export function wheelToCartPart(wheel: Wheel): AutoPart {
  // Товар без цены в корзину не кладётся — сервер считает сумму заявки по ней,
  // и ноль здесь превратился бы в счёт на ноль. Вызывающий обязан проверить
  // `priceKrw` до кнопки; это страховка на случай, если забыл.
  if (wheel.priceKrw === null) throw new Error(`Диск ${wheel.id}: цены продажи нет`);

  return {
    id: wheelCartId(wheel.id),
    slug: wheel.slug,
    brandSlug: wheel.brandSlug,
    modelSlug: '',
    category: 'diski',
    categoryRu: 'Диски',
    titleRu: wheelTitle(wheel, 'ru'),

    oemNumber: '',
    crossNumbers: [],

    brand: wheel.brandName,
    brandRu: wheel.brandName,
    model: wheel.model,

    // Года выпуска у диска нет: донор его не публикует, а привязка к модели авто
    // у нас наблюдение о совместимости, а не паспорт детали. Ноль честнее выдумки.
    yearFrom: 0,
    yearTo: 0,
    years: '',
    year: 0,

    side: '',
    position: '',

    priceKrw: wheel.priceKrw,
    priceKrwMax: wheel.priceKrw,

    // Экземпляр здесь один — само объявление. Разделения «товар/экземпляр»,
    // как у детали с разбора, у диска нет.
    offersCount: 1,
    inStock: wheel.sold ? 0 : 1,

    conditionGrade: '',
    conditionNotes: [],

    images: wheel.images.map((image) => image.url),
    connectorPins: '',

    // Вес комплекта из четырёх легкосплавных дисков R18–R20 — оценка, как и у детали.
    // От неё считается доставка, поэтому цифра живёт в одном месте, а не по компонентам.
    weightKg: wheel.quantity === 'single' ? 12 : 45,
    dimensionsCm: wheel.quantity === 'single' ? [60, 60, 30] : [70, 70, 80],
    deliveryDays: '',
    stock: wheel.sold ? 0 : 1,
    used: wheel.condition === 'used',
    aftermarket: wheel.wheelKind === 'forged',
  };
}

/** Подпись позиции на языке покупателя — корзина показывает её вместо `titleRu`. */
export const wheelCartTitle = (wheel: Wheel, locale: ShopLocale) => wheelTitle(wheel, locale);
