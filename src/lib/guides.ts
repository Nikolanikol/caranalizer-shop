// Реестр гайдов: слаги и карточные тексты для главной и индекса /guides.
// Полные тексты статей живут в самих страницах src/app/[lang]/guides/*.

export type GuideLocale = "ru" | "en" | "ar";

export interface GuideMeta {
  slug: string;
  title: Record<GuideLocale, string>;
  teaser: Record<GuideLocale, string>;
}

export const GUIDES: GuideMeta[] = [
  {
    slug: "kbchachacha-na-russkom",
    title: {
      ru: "KBChachacha на русском: как пользоваться сайтом",
      en: "KBChachacha explained: how to use the site",
      ar: "شرح KBChachacha: كيفية استخدام الموقع",
    },
    teaser: {
      ru: "Разбираем крупнейший сайт б/у авто Кореи: поиск, фильтры, что значат корейские пометки и как не пропустить проблемное авто.",
      en: "Korea's biggest used-car site: search, filters, what the Korean labels mean and how to spot a problem car.",
      ar: "أكبر موقع للسيارات المستعملة في كوريا: البحث والفلاتر ومعاني العلامات الكورية.",
    },
  },
  {
    slug: "encar-proverka-vin",
    title: {
      ru: "Проверка авто на Encar по VIN и номеру объявления",
      en: "Checking a car on Encar by VIN and listing number",
      ar: "فحص السيارة على Encar عبر VIN ورقم الإعلان",
    },
    teaser: {
      ru: "Где на Encar спрятаны страховая история, пробег и диагностика — и как прочитать их без знания корейского. Разбираем карточку по шагам.",
      en: "Where Encar hides the insurance history, mileage and inspection — and how to read them without Korean.",
      ar: "أين يخفي Encar تاريخ التأمين والمسافة والفحص — وكيف تقرأها دون معرفة الكورية.",
    },
  },
  {
    slug: "otchety-po-mashinam-iz-korei",
    title: {
      ru: "Отчёты по машинам из Кореи: какие бывают и как читать",
      en: "Korean car history reports: types and how to read them",
      ar: "تقارير تاريخ السيارات الكورية: أنواعها وكيفية قراءتها",
    },
    teaser: {
      ru: "Страховой отчёт, протокол осмотра, аукционный лист: что показывает каждый документ, каким цифрам верить и где продавец может умолчать.",
      en: "Insurance report, inspection protocol, auction sheet: what each document shows and which numbers to trust.",
      ar: "تقرير التأمين وبروتوكول الفحص وورقة المزاد: ماذا يعرض كل مستند.",
    },
  },
  {
    slug: "besplatnaya-proverka-avto-iz-korei",
    title: {
      ru: "Как бесплатно проверить авто из Кореи",
      en: "How to check a Korean car for free",
      ar: "كيف تفحص سيارة كورية مجاناً",
    },
    teaser: {
      ru: "Бесплатные способы проверить корейское авто перед покупкой: что можно увидеть самому в объявлении и что показывает наш бесплатный мини-отчёт.",
      en: "Free ways to verify a Korean car before buying — and what our free mini-report includes.",
      ar: "طرق مجانية للتحقق من سيارة كورية قبل الشراء — وما يتضمنه تقريرنا المصغر المجاني.",
    },
  },
  {
    slug: "avto-iz-korei-v-kazahstan",
    title: {
      ru: "Авто из Кореи в Казахстан: растаможка, сроки, стоимость",
      en: "Importing a Korean car to Kazakhstan: customs, timing, costs",
      ar: "استيراد سيارة كورية إلى كازاخستان: الجمارك والمدة والتكلفة",
    },
    teaser: {
      ru: "Полный маршрут: подбор и проверка в Корее, доставка, таможенные платежи Казахстана, утильсбор и первичная регистрация — из чего складывается цена.",
      en: "The full route: sourcing and checking in Korea, shipping, KZ customs duties and first registration.",
      ar: "المسار الكامل: الاختيار والفحص في كوريا والشحن ورسوم الجمارك في كازاخستان.",
    },
  },
  {
    slug: "kak-kupit-avto-na-encar",
    title: {
      ru: "Как купить авто на Encar из-за границы",
      en: "How to buy a car on Encar from abroad",
      ar: "كيف تشتري سيارة من Encar من الخارج",
    },
    teaser: {
      ru: "Пошагово: от выбора объявления до выкупа, оплаты и отправки — и почему иностранцу без представителя в Корее сделку закрыть не удастся.",
      en: "Step by step: from picking a listing to purchase, payment and shipping — and why you need a rep in Korea.",
      ar: "خطوة بخطوة: من اختيار الإعلان إلى الشراء والدفع والشحن.",
    },
  },
];
