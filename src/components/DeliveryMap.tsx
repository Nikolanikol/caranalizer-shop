"use client";

import { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ISO alpha-3 codes of all countries we deliver to
const DELIVERY_COUNTRIES = new Set([
  // EMS direct
  "AUS","BRA","CAN","CHN","FRA","DEU","HKG","IDN","JPN","MYS",
  "NZL","PHL","RUS","SGP","ESP","TWN","THA","GBR","USA","VNM",
  // Z1
  "KHM","LAO","MAC","MNG","MMR",
  // Z2
  "BGD","BTN","BRN","IND","MDV","NPL","LKA",
  // Z3
  "ALB","ARM","AUT","AZE","BHR","BLR","BEL","BGR","BIH","HRV",
  "CYP","CZE","DNK","EST","FIN","GEO","GRC","HUN","IRN","IRL",
  "ISR","JOR","KAZ","LVA","LTU","LUX","MDA","NLD","MKD","NOR",
  "OMN","PAK","POL","PRT","QAT","ROU","SAU","SVK","SVN","SWE",
  "CHE","TUR","UKR","ARE","UZB",
  // Z4
  "DZA","ARG","BWA","CPV","CHL","CRI","CUB","CUW","DJI","DOM",
  "ECU","EGY","ETH","FJI","KEN","MUS","MEX","MAR","MOZ","NGA",
  "PAN","PER","RWA","TZA","TUN","ZMB",
]);

const COUNTRY_NAMES: Record<string, { en: string; ru: string }> = {
  AUS:{en:"Australia",ru:"Австралия"},BRA:{en:"Brazil",ru:"Бразилия"},
  CAN:{en:"Canada",ru:"Канада"},CHN:{en:"China",ru:"Китай"},
  FRA:{en:"France",ru:"Франция"},DEU:{en:"Germany",ru:"Германия"},
  HKG:{en:"Hong Kong",ru:"Гонконг"},IDN:{en:"Indonesia",ru:"Индонезия"},
  JPN:{en:"Japan",ru:"Япония"},MYS:{en:"Malaysia",ru:"Малайзия"},
  NZL:{en:"New Zealand",ru:"Новая Зеландия"},PHL:{en:"Philippines",ru:"Филиппины"},
  RUS:{en:"Russia",ru:"Россия"},SGP:{en:"Singapore",ru:"Сингапур"},
  ESP:{en:"Spain",ru:"Испания"},TWN:{en:"Taiwan",ru:"Тайвань"},
  THA:{en:"Thailand",ru:"Таиланд"},GBR:{en:"United Kingdom",ru:"Великобритания"},
  USA:{en:"United States",ru:"США"},VNM:{en:"Vietnam",ru:"Вьетнам"},
  KHM:{en:"Cambodia",ru:"Камбоджа"},LAO:{en:"Laos",ru:"Лаос"},
  MNG:{en:"Mongolia",ru:"Монголия"},MMR:{en:"Myanmar",ru:"Мьянма"},
  BGD:{en:"Bangladesh",ru:"Бангладеш"},IND:{en:"India",ru:"Индия"},
  NPL:{en:"Nepal",ru:"Непал"},LKA:{en:"Sri Lanka",ru:"Шри-Ланка"},
  ALB:{en:"Albania",ru:"Албания"},ARM:{en:"Armenia",ru:"Армения"},
  AUT:{en:"Austria",ru:"Австрия"},AZE:{en:"Azerbaijan",ru:"Азербайджан"},
  BHR:{en:"Bahrain",ru:"Бахрейн"},BLR:{en:"Belarus",ru:"Беларусь"},
  BEL:{en:"Belgium",ru:"Бельгия"},BGR:{en:"Bulgaria",ru:"Болгария"},
  BIH:{en:"Bosnia",ru:"Босния"},HRV:{en:"Croatia",ru:"Хорватия"},
  CYP:{en:"Cyprus",ru:"Кипр"},CZE:{en:"Czech Republic",ru:"Чехия"},
  DNK:{en:"Denmark",ru:"Дания"},EST:{en:"Estonia",ru:"Эстония"},
  FIN:{en:"Finland",ru:"Финляндия"},GEO:{en:"Georgia",ru:"Грузия"},
  GRC:{en:"Greece",ru:"Греция"},HUN:{en:"Hungary",ru:"Венгрия"},
  IRN:{en:"Iran",ru:"Иран"},IRL:{en:"Ireland",ru:"Ирландия"},
  ISR:{en:"Israel",ru:"Израиль"},JOR:{en:"Jordan",ru:"Иордания"},
  KAZ:{en:"Kazakhstan",ru:"Казахстан"},LVA:{en:"Latvia",ru:"Латвия"},
  LTU:{en:"Lithuania",ru:"Литва"},LUX:{en:"Luxembourg",ru:"Люксембург"},
  MDA:{en:"Moldova",ru:"Молдова"},NLD:{en:"Netherlands",ru:"Нидерланды"},
  MKD:{en:"North Macedonia",ru:"Северная Македония"},NOR:{en:"Norway",ru:"Норвегия"},
  OMN:{en:"Oman",ru:"Оман"},PAK:{en:"Pakistan",ru:"Пакистан"},
  POL:{en:"Poland",ru:"Польша"},PRT:{en:"Portugal",ru:"Португалия"},
  QAT:{en:"Qatar",ru:"Катар"},ROU:{en:"Romania",ru:"Румыния"},
  SAU:{en:"Saudi Arabia",ru:"Саудовская Аравия"},SVK:{en:"Slovakia",ru:"Словакия"},
  SVN:{en:"Slovenia",ru:"Словения"},SWE:{en:"Sweden",ru:"Швеция"},
  CHE:{en:"Switzerland",ru:"Швейцария"},TUR:{en:"Turkiye",ru:"Турция"},
  UKR:{en:"Ukraine",ru:"Украина"},ARE:{en:"UAE",ru:"ОАЭ"},
  UZB:{en:"Uzbekistan",ru:"Узбекистан"},DZA:{en:"Algeria",ru:"Алжир"},
  ARG:{en:"Argentina",ru:"Аргентина"},CHL:{en:"Chile",ru:"Чили"},
  CRI:{en:"Costa Rica",ru:"Коста-Рика"},ECU:{en:"Ecuador",ru:"Эквадор"},
  EGY:{en:"Egypt",ru:"Египет"},ETH:{en:"Ethiopia",ru:"Эфиопия"},
  KEN:{en:"Kenya",ru:"Кения"},MAR:{en:"Morocco",ru:"Марокко"},
  MEX:{en:"Mexico",ru:"Мексика"},MOZ:{en:"Mozambique",ru:"Мозамбик"},
  NGA:{en:"Nigeria",ru:"Нигерия"},PAN:{en:"Panama",ru:"Панама"},
  PER:{en:"Peru",ru:"Перу"},TZA:{en:"Tanzania",ru:"Танзания"},
  TUN:{en:"Tunisia",ru:"Тунис"},ZMB:{en:"Zambia",ru:"Замбия"},
  RWA:{en:"Rwanda",ru:"Руанда"},DJI:{en:"Djibouti",ru:"Джибути"},
  FJI:{en:"Fiji",ru:"Фиджи"},BWA:{en:"Botswana",ru:"Ботсвана"},
  MUS:{en:"Mauritius",ru:"Маврикий"},DOM:{en:"Dominican Rep.",ru:"Доминиканская Республика"},
  BTN:{en:"Bhutan",ru:"Бутан"},BRN:{en:"Brunei",ru:"Бруней"},
  MDV:{en:"Maldives",ru:"Мальдивы"},MAC:{en:"Macao",ru:"Макао"},
  CPV:{en:"Cape Verde",ru:"Кабо-Верде"},CUB:{en:"Cuba",ru:"Куба"},
  CUW:{en:"Curacao",ru:"Кюрасао"},
};

interface TooltipState {
  name: string;
  x: number;
  y: number;
}

export function DeliveryMap({ locale = "ru" }: { locale?: string }) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-border-subtle bg-base-darker">
      <ComposableMap
        projectionConfig={{ scale: 147, center: [15, 10] }}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const iso = geo.properties?.["Alpha-3"] ?? geo.properties?.iso_a3 ?? geo.id;
              const isDelivery = DELIVERY_COUNTRIES.has(iso);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e) => {
                    if (!isDelivery) return;
                    const names = COUNTRY_NAMES[iso];
                    const name = names
                      ? locale === "ru" ? names.ru : names.en
                      : iso;
                    const rect = (e.target as SVGPathElement)
                      .closest("svg")
                      ?.getBoundingClientRect();
                    setTooltip({
                      name,
                      x: e.clientX - (rect?.left ?? 0),
                      y: e.clientY - (rect?.top ?? 0),
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    default: {
                      fill: isDelivery ? "rgba(59,130,246,0.7)" : "#1e293b",
                      stroke: "#0f172a",
                      strokeWidth: 0.5,
                      outline: "none",
                    },
                    hover: {
                      fill: isDelivery ? "#3b82f6" : "#1e293b",
                      stroke: "#0f172a",
                      strokeWidth: 0.5,
                      outline: "none",
                      cursor: isDelivery ? "pointer" : "default",
                    },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltip && (
        <div
          className="absolute z-10 px-3 py-1.5 rounded-lg bg-elevated border border-border text-sm font-medium text-text pointer-events-none shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y - 32 }}
        >
          {tooltip.name}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-primary/70 inline-block" />
          {locale === "ru" ? "Доставляем" : "We deliver"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-elevated inline-block border border-border-subtle" />
          {locale === "ru" ? "Недоступно" : "Unavailable"}
        </span>
      </div>
    </div>
  );
}
