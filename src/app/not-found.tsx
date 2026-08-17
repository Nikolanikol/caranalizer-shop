import Link from "next/link";
import "./globals.css";

/**
 * 404 для адресов вне сегмента `[lang]`.
 *
 * Свои `<html>` и `<body>` здесь обязательны: корневой layout их не рендерит — они
 * переехали в `[lang]/layout.tsx`, где известен язык. Без этого файла Next пришлось бы
 * отдавать страницу ошибки без корневых тегов.
 *
 * Попасть сюда трудно: middleware уводит почти всё, а `/ru/чего-нибудь-нет` показывает
 * 404 внутри раздела, со шапкой и футером. Этот файл — страховка, а не рабочая страница,
 * поэтому он намеренно минимален и не тянет переводы: языка на этом уровне ещё нет.
 */
export default function RootNotFound() {
  return (
    <html lang="ru">
      <body className="flex min-h-screen items-center justify-center bg-base px-6 text-center">
        <div className="space-y-4">
          <p className="font-mono text-sm tracking-widest text-text-dim">404</p>
          <h1 className="text-2xl font-bold text-text">Страница не найдена</h1>
          <p className="text-sm text-text-secondary">
            Такого адреса на сайте нет — возможно, он изменился.
          </p>
          <Link
            href="/ru"
            className="inline-block rounded-lg bg-cta px-5 py-2.5 text-sm font-semibold text-base-darker"
          >
            На главную
          </Link>
        </div>
      </body>
    </html>
  );
}
