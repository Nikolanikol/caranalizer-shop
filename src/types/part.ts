/**
 * Запись нормализованного каталога (data/catalog.json).
 * Собирается скриптом scripts/normalize.mjs из data/raw_parts.json — руками не правится.
 */
export interface AutoPart {
  id: string;
  /**
   * Последний сегмент адреса: /<category>/<brandSlug>/<modelSlug>/<slug>.
   * Уникален внутри своей марки и модели, а не глобально. Менять нельзя — на него встанут ссылки.
   */
  slug: string;
  /** Сегменты-посадочные. Модель не указана у 17 товаров — там `prochee`. */
  brandSlug: string;
  modelSlug: string;
  category: PartCategory;
  categoryRu: string;
  titleRu: string;
  titleKr: string;
  oemNumber: string;
  crossNumbers: string[];
  brand: string;
  /** Марка кириллицей — для поиска и текстов, не для адреса. */
  brandRu: string;
  model: string;
  year: number;
  years: string;
  generation: string;
  side: 'Левый (LH)' | 'Правый (RH)' | 'Центральный' | 'Комплект (L+R)';
  /** У противотуманок позиции нет — там пустая строка. */
  position: '' | 'Внешний (в крыло)' | 'Внутренний (в крышку багажника)';
  condition: string;
  conditionGrade: string;
  conditionNotes: string;
  /** Б/у разбор. false только у явно помеченного донором афтермаркета. */
  used: boolean;
  aftermarket: boolean;
  /** Цена хранится только в вонах. Рубли считает lib/pricing.ts — в данных их нет намеренно. */
  priceKrw: number;
  stock: number;
  deliveryDays: string;
  images: string[];
  /** Дата публикации у донора, YYYY-MM-DD. Считается из пути к фото — своего поля с датой нет. */
  listedAt: string;
  connectorPins: string;
  weightKg: number;
  dimensionsCm: [number, number, number];
  sourceUrl: string;
  verifiedOem: boolean;
  fitmentCompatibility: string[];
  /** Слова, по которым товар должен находиться: латиница и кириллица, партномер с дефисами и без. */
  keywords: string[];
}

export type PartCategory = 'zadnie-fonari' | 'protivotumannye-fary';

/** Позиция корзины. Храним снимок товара, цену считаем при отрисовке. */
export interface CartItem {
  part: AutoPart;
  quantity: number;
}
