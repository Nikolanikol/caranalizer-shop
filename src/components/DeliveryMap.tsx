"use client";

import { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Numeric ISO 3166-1 codes (used by world-atlas geo.id)
const DELIVERY_COUNTRIES = new Set([
  // EMS direct: AU,BR,CA,CN,FR,DE,HK,ID,JP,MY,NZ,PH,RU,SG,ES,TW,TH,GB,US,VN
  "36","76","124","156","250","276","344","360","392","458",
  "554","608","643","702","724","158","764","826","840","704",
  // Z1: Cambodia,Laos,Macao,Mongolia,Myanmar
  "116","418","446","496","104",
  // Z2: Bangladesh,Bhutan,Brunei,India,Maldives,Nepal,Sri Lanka
  "50","64","96","356","462","524","144",
  // Z3
  "8","51","40","31","48","112","56","100","70","191",
  "196","203","208","233","246","268","300","348","364","372",
  "376","400","398","428","440","442","498","528","807","578",
  "512","586","616","620","634","642","682","703","705","752",
  "756","792","804","784","860",
  // Z4
  "12","32","72","132","152","188","192","531","262","214",
  "218","818","231","242","404","480","484","504","508","566",
  "591","604","646","834","788","894",
]);

// Numeric ISO → names
const COUNTRY_NAMES: Record<string, { en: string; ru: string }> = {
  "36":{en:"Australia",ru:"Австралия"},"76":{en:"Brazil",ru:"Бразилия"},
  "124":{en:"Canada",ru:"Канада"},"156":{en:"China",ru:"Китай"},
  "250":{en:"France",ru:"Франция"},"276":{en:"Germany",ru:"Германия"},
  "344":{en:"Hong Kong",ru:"Гонконг"},"360":{en:"Indonesia",ru:"Индонезия"},
  "392":{en:"Japan",ru:"Япония"},"458":{en:"Malaysia",ru:"Малайзия"},
  "554":{en:"New Zealand",ru:"Новая Зеландия"},"608":{en:"Philippines",ru:"Филиппины"},
  "643":{en:"Russia",ru:"Россия"},"702":{en:"Singapore",ru:"Сингапур"},
  "724":{en:"Spain",ru:"Испания"},"158":{en:"Taiwan",ru:"Тайвань"},
  "764":{en:"Thailand",ru:"Таиланд"},"826":{en:"United Kingdom",ru:"Великобритания"},
  "840":{en:"United States",ru:"США"},"704":{en:"Vietnam",ru:"Вьетнам"},
  "116":{en:"Cambodia",ru:"Камбоджа"},"418":{en:"Laos",ru:"Лаос"},
  "496":{en:"Mongolia",ru:"Монголия"},"104":{en:"Myanmar",ru:"Мьянма"},
  "50":{en:"Bangladesh",ru:"Бангладеш"},"356":{en:"India",ru:"Индия"},
  "524":{en:"Nepal",ru:"Непал"},"144":{en:"Sri Lanka",ru:"Шри-Ланка"},
  "8":{en:"Albania",ru:"Албания"},"51":{en:"Armenia",ru:"Армения"},
  "40":{en:"Austria",ru:"Австрия"},"31":{en:"Azerbaijan",ru:"Азербайджан"},
  "48":{en:"Bahrain",ru:"Бахрейн"},"112":{en:"Belarus",ru:"Беларусь"},
  "56":{en:"Belgium",ru:"Бельгия"},"100":{en:"Bulgaria",ru:"Болгария"},
  "70":{en:"Bosnia",ru:"Босния"},"191":{en:"Croatia",ru:"Хорватия"},
  "196":{en:"Cyprus",ru:"Кипр"},"203":{en:"Czech Republic",ru:"Чехия"},
  "208":{en:"Denmark",ru:"Дания"},"233":{en:"Estonia",ru:"Эстония"},
  "246":{en:"Finland",ru:"Финляндия"},"268":{en:"Georgia",ru:"Грузия"},
  "300":{en:"Greece",ru:"Греция"},"348":{en:"Hungary",ru:"Венгрия"},
  "364":{en:"Iran",ru:"Иран"},"372":{en:"Ireland",ru:"Ирландия"},
  "376":{en:"Israel",ru:"Израиль"},"400":{en:"Jordan",ru:"Иордания"},
  "398":{en:"Kazakhstan",ru:"Казахстан"},"428":{en:"Latvia",ru:"Латвия"},
  "440":{en:"Lithuania",ru:"Литва"},"442":{en:"Luxembourg",ru:"Люксембург"},
  "498":{en:"Moldova",ru:"Молдова"},"528":{en:"Netherlands",ru:"Нидерланды"},
  "807":{en:"North Macedonia",ru:"Северная Македония"},"578":{en:"Norway",ru:"Норвегия"},
  "512":{en:"Oman",ru:"Оман"},"586":{en:"Pakistan",ru:"Пакистан"},
  "616":{en:"Poland",ru:"Польша"},"620":{en:"Portugal",ru:"Португалия"},
  "634":{en:"Qatar",ru:"Катар"},"642":{en:"Romania",ru:"Румыния"},
  "682":{en:"Saudi Arabia",ru:"Саудовская Аравия"},"703":{en:"Slovakia",ru:"Словакия"},
  "705":{en:"Slovenia",ru:"Словения"},"752":{en:"Sweden",ru:"Швеция"},
  "756":{en:"Switzerland",ru:"Швейцария"},"792":{en:"Turkiye",ru:"Турция"},
  "804":{en:"Ukraine",ru:"Украина"},"784":{en:"UAE",ru:"ОАЭ"},
  "860":{en:"Uzbekistan",ru:"Узбекистан"},"12":{en:"Algeria",ru:"Алжир"},
  "32":{en:"Argentina",ru:"Аргентина"},"152":{en:"Chile",ru:"Чили"},
  "188":{en:"Costa Rica",ru:"Коста-Рика"},"218":{en:"Ecuador",ru:"Эквадор"},
  "818":{en:"Egypt",ru:"Египет"},"231":{en:"Ethiopia",ru:"Эфиопия"},
  "404":{en:"Kenya",ru:"Кения"},"504":{en:"Morocco",ru:"Марокко"},
  "484":{en:"Mexico",ru:"Мексика"},"508":{en:"Mozambique",ru:"Мозамбик"},
  "566":{en:"Nigeria",ru:"Нигерия"},"591":{en:"Panama",ru:"Панама"},
  "604":{en:"Peru",ru:"Перу"},"834":{en:"Tanzania",ru:"Танзания"},
  "788":{en:"Tunisia",ru:"Тунис"},"894":{en:"Zambia",ru:"Замбия"},
  "646":{en:"Rwanda",ru:"Руанда"},"262":{en:"Djibouti",ru:"Джибути"},
  "72":{en:"Botswana",ru:"Ботсвана"},"480":{en:"Mauritius",ru:"Маврикий"},
  "214":{en:"Dominican Rep.",ru:"Доминиканская Республика"},
  "64":{en:"Bhutan",ru:"Бутан"},"96":{en:"Brunei",ru:"Бруней"},
  "192":{en:"Cuba",ru:"Куба"},
};

interface TooltipState {
  name: string;
  x: number;
  y: number;
  delivery: boolean;
}

export function DeliveryMap({ locale = "ru" }: { locale?: string }) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-border-subtle bg-base-darker">
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 147, center: [15, 5] }}
        viewBox="0 30 800 490"
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const numericId = String(geo.id);
              // Skip Antarctica by name (most reliable)
              if (geo.properties?.name === "Antarctica") return null;
              const isDelivery = DELIVERY_COUNTRIES.has(numericId);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e) => {
                    const names = COUNTRY_NAMES[numericId];
                    const name = names
                      ? locale === "ru" ? names.ru : names.en
                      : String(geo.properties?.name ?? numericId);
                    const rect = (e.target as SVGPathElement)
                      .closest("svg")
                      ?.getBoundingClientRect();
                    setTooltip({
                      name,
                      x: e.clientX - (rect?.left ?? 0),
                      y: e.clientY - (rect?.top ?? 0),
                      delivery: isDelivery,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    default: {
                      fill: isDelivery ? "rgba(59,130,246,0.7)" : "#1e293b",
                      stroke: "#0f172a",
                      strokeWidth: 0.5,
                                          },
                    hover: {
                      fill: isDelivery ? "#3b82f6" : "#1e293b",
                      stroke: "#0f172a",
                      strokeWidth: 0.5,
                                            cursor: isDelivery ? "pointer" : "default",
                    },
                    pressed: {},
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltip && (
        <div
          className="absolute z-10 px-3 py-2 rounded-lg bg-elevated border border-border text-sm pointer-events-none shadow-lg flex items-center gap-2"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${tooltip.delivery ? "bg-primary" : "bg-text-dim"}`} />
          <span className="font-medium text-text">{tooltip.name}</span>
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
