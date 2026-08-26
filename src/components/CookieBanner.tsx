"use client";

import { useSyncExternalStore } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { X } from "lucide-react";

const STORAGE_KEY = "ca-cookie-consent";

/**
 * Согласие лежит в localStorage — то есть вне React и только в браузере.
 *
 * Читаем его через useSyncExternalStore, а не установкой состояния из эффекта:
 * на сервере localStorage нет, а эффект давал лишний проход рендера, на котором
 * баннер успевал мигнуть уже согласившемуся посетителю. `getServerSnapshot`
 * возвращает «согласие есть», поэтому на сервере баннер не рисуется вовсе
 * и гидратация не расходится.
 */
let listeners: Array<() => void> = [];

function subscribe(onChange: () => void) {
  listeners.push(onChange);
  return () => {
    listeners = listeners.filter((listener) => listener !== onChange);
  };
}

function hasConsent() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    // Приватный режим: хранить ответ негде, и спрашивать каждый раз заново — хуже
    // молчания. Считаем, что спрашивать не о чем.
    return true;
  }
}

function grantConsent() {
  try {
    localStorage.setItem(STORAGE_KEY, "accepted");
  } catch {
    // Не сохранилось — баннер вернётся в следующий раз. Падать тут не из-за чего.
  }
  for (const listener of listeners) listener();
}

export function CookieBanner() {
  const locale = useLocale();
  const consented = useSyncExternalStore(subscribe, hasConsent, () => true);

  if (consented) return null;

  const t = {
    ru: {
      text: "Мы используем файлы cookie и аналитику для улучшения работы сайта.",
      link: "Политика конфиденциальности",
      btn: "Принять",
    },
    en: {
      text: "We use cookies and analytics to improve your experience.",
      link: "Privacy Policy",
      btn: "Accept",
    },
    ar: {
      text: "نستخدم ملفات تعريف الارتباط والتحليلات لتحسين تجربتك.",
      link: "سياسة الخصوصية",
      btn: "قبول",
    },
  }[locale] ?? {
    text: "We use cookies and analytics to improve your experience.",
    link: "Privacy Policy",
    btn: "Accept",
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-elevated border border-border rounded-2xl px-5 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <p className="text-sm text-text-muted flex-1">
          {t.text}{" "}
          <Link href="/privacy" className="text-primary underline underline-offset-2 hover:no-underline">
            {t.link}
          </Link>
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={grantConsent}
            className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors"
          >
            {t.btn}
          </button>
          <button
            onClick={grantConsent}
            className="p-1.5 text-text-dim hover:text-text transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
