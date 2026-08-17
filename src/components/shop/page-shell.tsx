import React from 'react';

/**
 * Обёртка текстовых страниц раздела — доставка, гарантия, как заказать.
 * Заголовок здесь единственный h1 на странице: логотип в шапке остаётся span.
 *
 * Корневой элемент — div, а не main: <main> уже раскрыт в layout сайта.
 */
export function PageShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 w-full">
      <div className="bg-base border-b border-border-subtle py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-3xl sm:text-4xl font-black text-text tracking-tight leading-tight">{title}</h1>
          {intro && <p className="text-sm text-text-secondary leading-relaxed">{intro}</p>}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">{children}</div>
    </div>
  );
}

/** Раздел текстовой страницы. h2 — второй уровень, под единственным h1 выше. */
export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-text tracking-tight">{title}</h2>
      <div className="text-sm text-text-secondary leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

/**
 * Текст, которого у нас пока нет. Видно и в интерфейсе, и в коде — чтобы такую страницу
 * нельзя было случайно выкатить на прод, приняв заглушку за готовый раздел.
 *
 * Сейчас без пользователей и оставлен намеренно: в `AGENTS.md` перечислено, что ещё
 * предстоит дописать в оферте раздела, и заглушка там понадобится снова. Своё дело он
 * уже сделал — раздел «Реквизиты» на «Как заказать» не уехал на прод недописанным.
 */
export function Todo({ children }: { children: React.ReactNode }) {
  return (
    <p className="bg-amber-950/30 border border-amber-900/50 rounded p-4 text-xs text-amber-200/80 leading-relaxed">
      <strong className="font-bold text-amber-300">Заполнить перед запуском.</strong> {children}
    </p>
  );
}
