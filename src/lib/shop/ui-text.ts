import type { ShopLocale } from './terms';

/**
 * Подписи интерфейса раздела запчастей.
 *
 * Отдельно от `terms.ts`: там термины каталога, которые приходят из данных донора
 * и сверяются с ними скриптом `partsfit:terms`; здесь — надписи на кнопках, которые
 * мы придумали сами и которые никакой проверке по данным не подлежат.
 *
 * Отдельно от `messages/*.json`: те словари обслуживают сайт вокруг раздела и живут
 * на next-intl. Раздел ими не пользуется намеренно — он серверный почти целиком,
 * а `useTranslations` в асинхронном компоненте вызывать нельзя, и ради каждой подписи
 * пришлось бы делить страницу на обёртку и тело. Проще отдать язык пропсом.
 *
 * Прозу страниц сюда не сносить: она живёт рядом со своей страницей. Здесь только то,
 * что показывается больше чем в одном месте.
 */
export const UI: Record<ShopLocale, Record<string, string>> = {
  ru: {
    section: 'Запчасти',
    allParts: 'Все запчасти',

    // Сортировка
    sortPopular: 'По умолчанию',
    sortNewest: 'Сначала новые',
    sortPriceAsc: 'Сначала дешёвые',
    sortPriceDesc: 'Сначала дорогие',

    // Список товаров
    found: 'Найдено',
    forQuery: 'по запросу',
    nothingFound: 'Ничего не найдено',
    nothingFoundHint: 'Попробуйте другой артикул или сбросьте фильтры.',
    resetFilters: 'Сбросить фильтры',

    // Фильтр
    filters: 'Фильтры каталога',
    brand: 'Марка автомобиля',
    model: 'Модель',
    side: 'Сторона установки',
    position: 'Расположение',
    sideLeft: 'Левая',
    sideRight: 'Правая',
    positionOuter: 'В крыло',
    positionInner: 'В крышку',
    allBrands: 'Все марки',
    allModels: 'Все модели',
    anySide: 'Любая сторона',
    anyPosition: 'Любое',
    reset: 'Сбросить',

    // Поиск и страницы
    searchLabel: 'Поиск по каталогу',
    searchPlaceholder: 'Артикул, марка или модель — например, Соната',
    searchSubmit: 'Найти',
    pages: 'Страницы каталога',
    prev: 'Назад',
    next: 'Вперёд',

    // Карточка товара
    noPhoto: 'Фото нет',
    aftermarket: 'Аналог',
    photos: 'фото',
    onRequest: 'по запросу',
    shippingExtra: 'Доставка оплачивается отдельно',
    addToCart: 'В корзину',

    // Характеристики детали
    specBrand: 'Марка',
    specModel: 'Модель',
    specYears: 'Годы',
    specSide: 'Сторона',
    specPosition: 'Расположение',
    specCross: 'Кросс-номера',
    specWeight: 'Вес',
    specSize: 'Габариты',
    estimate: 'оценка',
    kg: 'кг',
    cm: 'см',
    breadcrumbs: 'Хлебные крошки',

    // Экземпляры детали
    offers: 'Экземпляры этой детали',
    offersHint: 'Это разные детали с разных машин. Цена, состояние и фотографии у каждой свои.',
    thisOffer: 'Этот экземпляр',
    outOfStock: 'Этой детали сейчас нет в наличии.',
    donorCar: 'Машина, с которой снята деталь',
    checkVin: 'Проверить историю этой машины по VIN →',
    connector: 'Разъём',
    pins: 'контактов',
    bodyColor: 'Цвет кузова',
    instance: 'экземпляр',
    photo: 'Фото',
    photoOf: 'из',
    notSure: 'Не уверены, что подойдёт?',
    howToReach: 'Как с нами связаться',
    delivery: 'Доставка',
    deliveryDays: '',
  },
  en: {
    section: 'Parts',
    allParts: 'All parts',

    sortPopular: 'Default',
    sortNewest: 'Newest first',
    sortPriceAsc: 'Cheapest first',
    sortPriceDesc: 'Most expensive first',

    found: 'Found',
    forQuery: 'for',
    nothingFound: 'Nothing found',
    nothingFoundHint: 'Try another part number or clear the filters.',
    resetFilters: 'Clear filters',

    filters: 'Catalog filters',
    brand: 'Car make',
    model: 'Model',
    side: 'Side',
    position: 'Position',
    sideLeft: 'Left',
    sideRight: 'Right',
    positionOuter: 'Fender',
    positionInner: 'Tailgate',
    allBrands: 'All makes',
    allModels: 'All models',
    anySide: 'Any side',
    anyPosition: 'Any',
    reset: 'Reset',

    searchLabel: 'Search the catalog',
    searchPlaceholder: 'Part number, make or model — Sonata, for example',
    searchSubmit: 'Search',
    pages: 'Catalog pages',
    prev: 'Back',
    next: 'Next',

    noPhoto: 'No photo',
    aftermarket: 'Aftermarket',
    photos: 'photos',
    onRequest: 'on request',
    shippingExtra: 'Shipping charged separately',
    addToCart: 'Add to cart',

    specBrand: 'Make',
    specModel: 'Model',
    specYears: 'Years',
    specSide: 'Side',
    specPosition: 'Position',
    specCross: 'Cross numbers',
    specWeight: 'Weight',
    specSize: 'Dimensions',
    estimate: 'estimate',
    kg: 'kg',
    cm: 'cm',
    breadcrumbs: 'Breadcrumbs',

    offers: 'Items of this part',
    offersHint: 'These are different items off different cars. Price, condition and photos are their own.',
    thisOffer: 'This item',
    outOfStock: 'This part is out of stock right now.',
    donorCar: 'The car this part came off',
    checkVin: 'Check this car history by VIN →',
    connector: 'Connector',
    pins: 'pins',
    bodyColor: 'Body colour',
    instance: 'item',
    photo: 'Photo',
    photoOf: 'of',
    notSure: 'Not sure it fits?',
    howToReach: 'How to reach us',
    delivery: 'Shipping',
    // Сроки у нас посчитаны под Россию — по миру их нет, и выдумывать нельзя.
    deliveryDays: 'calculated per request',
  },
};

/** Короткий доступ: `const t = ui(locale)`. */
export function ui(locale: ShopLocale): Record<string, string> {
  return UI[locale];
}
