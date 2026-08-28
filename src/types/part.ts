/**
 * Модель каталога: деталь и экземпляр — разные сущности.
 *
 * Донор торгует разбором, и одна деталь лежит у него в нескольких экземплярах с разных
 * машин: у левой фары Genesis G80 их шестьдесят четыре. Артикул, марка, модель и сторона
 * у них общие, а цена, состояние, фотографии и VIN донорской машины — свои.
 *
 * Поэтому `AutoPart` — это страница каталога, а `Offer` — физический товар на ней.
 * Данные приходят из `partsfit_products` и `partsfit_offers`; собирает их
 * `lib/shop/catalog.ts`, руками не правится ничего.
 */

/** Сегмент адреса категории. Русские тексты к ним — в `CATEGORIES` из `lib/shop/catalog.ts`. */
export type PartCategory =
  | 'perednie-fary'
  | 'zadnie-fonari'
  | 'protivotumannye-fary'
  | 'bokovye-zerkala'
  | 'blok-komforta-bcm'
  | 'blok-upravleniya-dvigatelem'
  | 'blok-upravleniya-akpp'
  | 'blok-abs'
  | 'elektronnye-bloki'
  | 'nakladka-zadney-paneli'
  | 'obshivka-dveri-bagazhnika';

/**
 * Раздел витрины. Шире, чем тип детали: с 29.08.2026 в разделе есть диски со второго
 * донора (skywheel.kr), а типом детали они не являются — у них нет ни партномера,
 * ни стороны, ни позиции, и живут они в своих таблицах `skywheel_*`.
 *
 * Появился потому, что корзина одна на весь раздел и хранит снимок товара `AutoPart`.
 * Заводить ей второй тип позиции значило бы переписать самый денежный клиентский
 * компонент ради поля, которое используется как ярлык.
 */
export type ShopSection = PartCategory | 'diski';

/**
 * Экземпляр — конкретная деталь, снятая с конкретной машины. Именно он покупается,
 * и именно его фотографии смотрит покупатель: скол будет на той детали, которая приедет.
 */
export interface Offer {
  /** `product_no` донора. */
  id: string;
  productId: string;

  /** Цена только в вонах. Рубли и доллары считает `lib/shop/pricing.ts` по курсу ЦБ. */
  priceKrw: number;
  year: number;

  /**
   * Грейд из описания донора: `A+`, `A`, `B`, `C`. Пустая строка значит, что донор
   * о состоянии ничего не написал, — и подписывать это надо «состояние не указано»,
   * а не «дефектов не отмечено».
   */
  conditionGrade: string;
  conditionRu: string;
  conditionNotes: string[];
  /** Исходная строка донора по-корейски. Менеджеру она нужнее любого перевода. */
  conditionKo: string;

  /** VIN машины, с которой снята деталь. Есть примерно у 60% экземпляров. */
  donorVin: string;

  lampTypeRu: string;
  completenessRu: string;
  featuresRu: string[];
  /** Число контактов разъёма и раскладка колодки («3+2+2»). */
  pins: number | null;
  pinsLayout: string;
  /** Цвет кузова у зеркал и кузовщины: код важнее названия. */
  colorCode: string;
  colorName: string;

  used: boolean;
  aftermarket: boolean;
  soldOut: boolean;
  /** Дата появления у донора. Считается из пути к фотографиям. */
  listedAt: string;
  sourceUrl: string;

  /** Хотлинк на CDN донора. Фото проданной детали однажды отдаст 404 — нужна заглушка. */
  images: string[];
}

/**
 * Деталь — страница каталога.
 *
 * Часть полей — сводка по экземплярам (`priceKrw` это минимум, `conditionGrade` —
 * лучший грейд): они нужны списку товаров, где экземпляры не раскрыты.
 */
export interface AutoPart {
  /** Полный путь: `perednie-fary/kia/sorento/levyy-921013e000`. */
  id: string;
  /**
   * Последний сегмент адреса. Уникален внутри своей марки и модели, а не глобально:
   * один партномер стоит на разных машинах.
   */
  slug: string;
  brandSlug: string;
  modelSlug: string;
  category: ShopSection;
  categoryRu: string;
  titleRu: string;

  oemNumber: string;
  crossNumbers: string[];

  brand: string;
  /** Марка кириллицей — для поиска и текстов, не для адреса. */
  brandRu: string;
  model: string;

  /** Годы — диапазон: одна деталь стоит на нескольких модельных годах. */
  yearFrom: number;
  yearTo: number;
  /** Готовая подпись: «2015» или «2002–2005». */
  years: string;
  /** Для мест, где нужен один год. Берётся поздний. */
  year: number;

  side: string;
  /** У большинства типов позиции нет — там пустая строка. */
  position: string;

  /** Минимальная цена среди экземпляров; максимальная — рядом. */
  priceKrw: number;
  priceKrwMax: number;

  /** Сколько экземпляров на странице и сколько из них не продано. */
  offersCount: number;
  inStock: number;

  /** Лучший грейд среди экземпляров. Пустая строка — состояние не указано. */
  conditionGrade: string;
  /** Заметки о дефектах представительного экземпляра. */
  conditionNotes: string[];

  /** Фотографии представительного экземпляра — обложка для списка. */
  images: string[];
  connectorPins: string;

  /**
   * Оценки, а не данные: у донора нет ни веса, ни габаритов, ни сроков.
   * От веса считается доставка, поэтому цифры держим в одном месте — `PART_DEFAULTS`.
   */
  weightKg: number;
  dimensionsCm: [number, number, number];
  deliveryDays: string;
  stock: number;
  used: boolean;
  aftermarket: boolean;

  /** Экземпляры. Заполняются только на странице детали — в списках они не нужны. */
  offers?: Offer[];
}

/** Позиция корзины. Храним снимок экземпляра: цена у каждого своя. */
export interface CartItem {
  part: AutoPart;
  offerId?: string;
  quantity: number;
}
