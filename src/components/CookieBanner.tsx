"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { X } from "lucide-react";

const STORAGE_KEY = "ca-cookie-consent";

export function CookieBanner() {
  const locale = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

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
            onClick={accept}
            className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors"
          >
            {t.btn}
          </button>
          <button
            onClick={accept}
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
