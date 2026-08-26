import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

/**
 * Корневой layout намеренно ничего не рендерит, кроме детей.
 *
 * `<html>` и `<body>` живут в `[lang]/layout.tsx`: только там известен язык — он приходит
 * сегментом пути. Раньше они были здесь, а язык брался через `getLocale()`, который при
 * отсутствии кэша читает заголовки запроса. Одно это обращение к `headers()` в корневом
 * layout переводило в динамический рендер **весь сайт**: ни одна страница не собиралась
 * заранее, и каждый запрос к любой из 967 карточек товара заново читал каталог на 2.4 МБ.
 *
 * Метаданные остаются здесь: они наследуются вниз и языка не требуют.
 */
export const metadata: Metadata = {
  title: {
    default: "Caranalizer — проверка авто из Кореи и б/у запчасти с разборов",
    template: "%s",
  },
  // Заголовок и описание по умолчанию. До этого здесь оставалась вывеска первого
  // магазина («140,000+ OEM parts»), которого давно нет: наш товар — б/у с разборов.
  description:
    "Проверка истории корейского автомобиля по VIN и по объявлениям Encar, KBChachacha, Kcar. Б/у запчасти с корейских авторазборов — оптика, зеркала, блоки управления — с отправкой по России.",
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [{ url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  verification: {
    google: "xyGySZjOk_Gt-JrVaVUX6TlL_w5nw-WPd9_yDA3c8GU",
    yandex: "1f004d7949535b31",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
