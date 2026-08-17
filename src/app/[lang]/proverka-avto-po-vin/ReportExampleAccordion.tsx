"use client";

/**
 * Пример отчёта под аккордеоном и с ленивой загрузкой.
 *
 * `ReportExample` — 1121 строка разметки с вымышленными данными на три языка сразу.
 * Разворачивает его меньшинство посетителей, а платили за него все: блок висел
 * в HTML страницы целиком.
 *
 * `ssr: false` здесь обязателен и осознан. Компонент серверный и без хуков, но внутри
 * клиентской границы он всё равно уедет в браузер, поэтому единственный способ не
 * отдавать его сразу — вынести в отдельный чанк и запросить по клику. Индексации это
 * не стоит ничего: пример — демонстрация формата, а не текст, по которому нас ищут,
 * и `/report` за три месяца не собрал в поиске ни одного показа.
 *
 * Чанк подтягивается только когда `open` впервые стало true: до этого `<Example />`
 * не отрисовывается, и `next/dynamic` за импортом не идёт.
 */

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { ChevronDown, FileText } from "lucide-react";
import type { GuideLocale } from "@/lib/guides";

const Example = dynamic(() => import("./ReportExample").then((m) => m.ReportExample), {
  ssr: false,
  loading: () => <ExampleSkeleton />,
});

/**
 * Заглушка на время загрузки чанка. Светлая и высокая — под цвет и примерный рост
 * самого документа, чтобы страница не прыгала, когда пример подставится.
 */
function ExampleSkeleton() {
  return (
    <div
      className="rounded-xl bg-white/95 p-8 space-y-4 animate-[pulse_1.5s_ease-in-out_infinite]"
      style={{ minHeight: 520 }}
      aria-hidden="true"
    >
      <div className="h-6 w-2/5 rounded bg-slate-200" />
      <div className="h-3 w-1/4 rounded bg-slate-100" />
      <div className="mt-8 grid grid-cols-2 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 rounded bg-slate-100" />
        ))}
      </div>
      <div className="h-40 rounded bg-slate-100" />
    </div>
  );
}

export function ReportExampleAccordion({ lang }: { lang: GuideLocale }) {
  const t = useTranslations("report");
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="report-example"
        className="group mx-auto flex items-center gap-3 rounded-xl border border-border bg-elevated px-6 py-4 text-sm font-semibold text-text transition-colors hover:border-primary hover:bg-surface cursor-pointer"
      >
        <FileText className="h-5 w-5 text-primary shrink-0" />
        <span>{open ? t("exampleHide") : t("exampleShow")}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-text-muted transition-transform motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/*
        Держим блок в разметке всегда, чтобы aria-controls ссылался на существующий
        элемент, но содержимое монтируем только в раскрытом виде — иначе чанк
        загрузился бы сразу, и вся затея потеряла бы смысл.
      */}
      <div id="report-example" role="region" aria-label={t("exampleTitle")} hidden={!open}>
        {open && <Example lang={lang} />}
      </div>
    </div>
  );
}
