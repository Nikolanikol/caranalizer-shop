"use client";

import { useState } from "react";
import { useLocale } from "next-intl";

const WA_PHONE = "821058654344";

const TG_LABEL: Record<string, string> = {
  ru: "Написать в Telegram",
  en: "Write on Telegram",
  ar: "اكتب على تيليغرام",
};

const WA_LABEL: Record<string, string> = {
  ru: "Написать в WhatsApp",
  en: "Write on WhatsApp",
  ar: "اكتب على واتساب",
};

const WA_TEXT: Record<string, string> = {
  ru: "Здравствуйте! Хочу узнать о запчастях из Кореи",
  en: "Hello! I'd like to know more about Korean car parts",
  ar: "مرحباً! أريد معرفة المزيد عن قطع غيار السيارات الكورية",
};

const TG_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 shrink-0">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.48 13.617l-2.95-.924c-.64-.203-.654-.64.136-.948l11.52-4.44c.532-.194 1 .12.376.943z" />
  </svg>
);

const WA_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 shrink-0">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const CHAT_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const CLOSE_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function FloatButton({
  href,
  label,
  icon,
  color,
  hoverColor,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex items-center gap-3 ${color} ${hoverColor} text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300`}
      style={{ padding: hovered ? "14px 20px 14px 16px" : "10px" }}
    >
      {icon}
      <span
        className="text-sm font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 hidden sm:inline"
        style={{ maxWidth: hovered ? "180px" : "0px", opacity: hovered ? 1 : 0 }}
      >
        {label}
      </span>
    </a>
  );
}

export function MessengerButtons() {
  const locale = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);

  const waText = encodeURIComponent(WA_TEXT[locale] ?? WA_TEXT.ru);
  const waUrl = `https://wa.me/${WA_PHONE}?text=${waText}`;
  const tgUrl = "https://t.me/axiskorea";

  return (
    <div className="fixed bottom-6 end-6 z-50 flex flex-col items-end gap-3">
      <div className="hidden sm:flex flex-col gap-3">
        <FloatButton
          href={waUrl}
          label={WA_LABEL[locale] ?? WA_LABEL.ru}
          icon={WA_SVG}
          color="bg-[#25D366]"
          hoverColor="hover:bg-[#1db954]"
        />
        <FloatButton
          href={tgUrl}
          label={TG_LABEL[locale] ?? TG_LABEL.ru}
          icon={TG_SVG}
          color="bg-[#229ED9]"
          hoverColor="hover:bg-[#1a8bc2]"
        />
      </div>

      <div className="sm:hidden flex flex-col items-end gap-2">
        <div className={`flex-col gap-2 ${mobileOpen ? "flex" : "hidden"}`}>
          <FloatButton
            href={waUrl}
            label={WA_LABEL[locale] ?? WA_LABEL.ru}
            icon={WA_SVG}
            color="bg-[#25D366]"
            hoverColor="hover:bg-[#1db954]"
          />
          <FloatButton
            href={tgUrl}
            label={TG_LABEL[locale] ?? TG_LABEL.ru}
            icon={TG_SVG}
            color="bg-[#229ED9]"
            hoverColor="hover:bg-[#1a8bc2]"
          />
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`p-3 rounded-full text-white shadow-lg transition-all duration-300 cursor-pointer ${
            mobileOpen ? "bg-surface hover:bg-surface/80" : "bg-cta hover:bg-cta-hover"
          }`}
          aria-label="Toggle messenger buttons"
        >
          {mobileOpen ? CLOSE_SVG : CHAT_SVG}
        </button>
      </div>
    </div>
  );
}
