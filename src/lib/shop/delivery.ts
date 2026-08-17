/**
 * Города и сроки доставки из Кореи через Владивосток.
 * Цифры оценочные и заданы вручную — это не тариф перевозчика, а ориентир для покупателя.
 *
 * В корзине показываются только названия и сроки: стоимость доставки в итог не входит,
 * её считает менеджер по конкретной заявке. Плоские 1450 ₽ на все города отсюда убраны —
 * покупатель из Владивостока видел московскую цену.
 */
export interface DeliveryCity {
  name: string;
  days: string;
  cdekCost: number;
  cargoCost: number;
}

export const RUSSIAN_CITIES: DeliveryCity[] = [
  { name: 'Москва', days: '7-10 дней', cdekCost: 1450, cargoCost: 2200 },
  { name: 'Санкт-Петербург', days: '8-11 дней', cdekCost: 1550, cargoCost: 2300 },
  { name: 'Владивосток', days: '3-5 дней', cdekCost: 850, cargoCost: 1400 },
  { name: 'Хабаровск', days: '4-6 дней', cdekCost: 950, cargoCost: 1500 },
  { name: 'Новосибирск', days: '6-9 дней', cdekCost: 1350, cargoCost: 2000 },
  { name: 'Екатеринбург', days: '7-10 дней', cdekCost: 1400, cargoCost: 2100 },
  { name: 'Казань', days: '7-10 дней', cdekCost: 1450, cargoCost: 2200 },
  { name: 'Краснодар', days: '8-11 дней', cdekCost: 1500, cargoCost: 2300 },
  { name: 'Ростов-на-Дону', days: '8-11 дней', cdekCost: 1500, cargoCost: 2300 },
  { name: 'Самара', days: '7-10 дней', cdekCost: 1450, cargoCost: 2200 },
  { name: 'Уфа', days: '7-10 дней', cdekCost: 1450, cargoCost: 2200 },
  { name: 'Красноярск', days: '6-9 дней', cdekCost: 1300, cargoCost: 1950 },
  { name: 'Иркутск', days: '5-8 дней', cdekCost: 1200, cargoCost: 1800 },
  { name: 'Челябинск', days: '7-10 дней', cdekCost: 1400, cargoCost: 2100 },
  { name: 'Нижний Новгород', days: '7-10 дней', cdekCost: 1450, cargoCost: 2200 },
  { name: 'Тюмень', days: '7-10 дней', cdekCost: 1400, cargoCost: 2100 },
  { name: 'Омск', days: '7-10 дней', cdekCost: 1400, cargoCost: 2100 },
  { name: 'Волгоград', days: '8-11 дней', cdekCost: 1500, cargoCost: 2300 },
  { name: 'Сочи', days: '9-12 дней', cdekCost: 1600, cargoCost: 2400 },
  { name: 'Пермь', days: '7-10 дней', cdekCost: 1450, cargoCost: 2200 },
];
