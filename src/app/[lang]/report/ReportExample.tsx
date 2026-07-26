// Демонстрационный Carhistory-отчёт: показывает структуру и глубину платного
// отчёта. Данные вымышленные (VIN и госномер частично скрыты) — это витрина
// формата, а не запись о реальном автомобиле; плашка об этом обязательна.
import type { GuideLocale } from "@/lib/guides";
import {
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Car,
  Gauge,
  FileText,
  Wrench,
  Coins,
} from "lucide-react";

type Status = "danger" | "warn" | "ok";

interface ReportData {
  disclaimer: string;
  vinLabel: string;
  vin: string;
  car: string;
  updatedLabel: string;
  updated: string;

  summaryTitle: string;
  summary: { label: string; value: string; status: Status }[];

  specsTitle: string;
  specs: [string, string][];

  usageTitle: string;
  usage: { label: string; value: string; status: Status }[];

  ownersTitle: string;
  ownersCols: string[];
  owners: string[][];

  claimsTitle: string;
  claimsNote: string;
  claims: {
    date: string;
    type: string;
    kind?: string;
    total: string;
    breakdown?: [string, string][];
    parts?: string[];
    partsTitle: string;
  }[];

  mileageTitle: string;
  mileageCols: string[];
  mileage: string[][];
  mileageNote: string;

  valueTitle: string;
  value: string;
  valueNote: string;
}

const STATUS_STYLES: Record<Status, string> = {
  danger: "bg-error/10 text-error border-error/20",
  warn: "bg-cta/10 text-cta border-cta/20",
  ok: "bg-success/10 text-success border-success/20",
};

const DATA: Record<GuideLocale, ReportData> = {
  ru: {
    disclaimer:
      "Пример отчёта. Данные демонстрационные, VIN и госномер скрыты. В реальном отчёте все поля заполнены по конкретному автомобилю.",
    vinLabel: "VIN",
    vin: "KMHS381ADMU•••••",
    car: "Hyundai Santa Fe · 2021",
    updatedLabel: "Данные обновлены",
    updated: "18.07.2026",

    summaryTitle: "Сводка",
    summary: [
      { label: "Тотальная гибель", value: "Нет", status: "ok" },
      { label: "Угон / розыск", value: "Нет", status: "ok" },
      { label: "Затопление", value: "Нет", status: "ok" },
      { label: "Коммерческое использование", value: "Да — такси", status: "danger" },
      { label: "Ущерб своему авто", value: "2 случая · 3 480 000 ₩", status: "warn" },
      { label: "Ущерб чужому авто", value: "1 случай · 620 400 ₩", status: "warn" },
      { label: "Смена владельца", value: "2 раза", status: "warn" },
      { label: "Смена госномера", value: "1 раз", status: "ok" },
    ],

    specsTitle: "Характеристики по VIN",
    specs: [
      ["Марка", "Hyundai"],
      ["Модель", "Santa Fe (TM)"],
      ["Объём двигателя", "2 151 см³"],
      ["Тип топлива", "Дизель"],
      ["Цвет", "Белый"],
      ["Модельный год", "2021"],
      ["Тип кузова", "Внедорожник, 5 дверей"],
      ["Назначение", "Личное"],
      ["Дата производства", "14.03.2021"],
      ["Первая регистрация", "02.04.2021"],
    ],

    usageTitle: "Коммерческая эксплуатация",
    usage: [
      { label: "Прокат / каршеринг", value: "Нет", status: "ok" },
      { label: "Работа в такси", value: "Да · 04.2021 — 08.2023", status: "danger" },
      { label: "Государственная служба", value: "Нет", status: "ok" },
    ],

    ownersTitle: "История владельцев и номеров",
    ownersCols: ["Дата", "Событие", "Госномер", "Назначение"],
    owners: [
      ["11.02.2025", "Смена владельца", "72로 ••••", "Личное"],
      ["30.08.2023", "Смена владельца и номера", "72로 ••••", "Личное"],
      ["02.04.2021", "Первичная регистрация", "18바 ••••", "Такси"],
    ],

    claimsTitle: "Страховые случаи",
    claimsNote:
      "Указаны выплаты, прошедшие через страховые компании. Ремонт за наличные в страховой истории не отражается — его показывает протокол осмотра.",
    claims: [
      {
        date: "23.11.2024",
        type: "Ущерб своему автомобилю",
        kind: "ДТП, водитель — виновник",
        total: "2 910 000 ₩",
        breakdown: [
          ["Запчасти", "1 640 000 ₩"],
          ["Работы", "610 000 ₩"],
          ["Покраска", "660 000 ₩"],
        ],
        partsTitle: "Что ремонтировалось",
        parts: [
          "Переднее левое крыло — замена",
          "Передний бампер — замена и покраска",
          "Капот — рихтовка и покраска",
          "Блок-фара левая — замена",
          "Лонжерон передний левый — правка",
        ],
      },
      {
        date: "07.06.2022",
        type: "Ущерб своему автомобилю",
        kind: "Повреждение на парковке",
        total: "570 000 ₩",
        breakdown: [
          ["Запчасти", "180 000 ₩"],
          ["Работы", "140 000 ₩"],
          ["Покраска", "250 000 ₩"],
        ],
        partsTitle: "Что ремонтировалось",
        parts: ["Задняя правая дверь — покраска", "Молдинг двери — замена"],
      },
      {
        date: "19.09.2021",
        type: "Ущерб чужому автомобилю",
        kind: "Выплата пострадавшей стороне",
        total: "620 400 ₩",
        partsTitle: "Что ремонтировалось",
      },
    ],

    mileageTitle: "История пробега",
    mileageCols: ["Дата", "Пробег", "Источник"],
    mileage: [
      ["11.02.2025", "148 320 км", "Страховая компания"],
      ["30.08.2023", "121 640 км", "Площадка продажи авто"],
      ["16.10.2022", "83 970 км", "Техосмотр"],
      ["07.06.2022", "61 205 км", "Страховая компания"],
    ],
    mileageNote:
      "Записи идут по возрастанию — скручивания нет. Разрыв между датами в 1,5 года при +38 000 км типичен для такси.",

    valueTitle: "Оценочная стоимость в Корее",
    value: "21 400 000 — 24 900 000 ₩",
    valueNote: "Диапазон страховой оценки на дату отчёта, без учёта доставки и растаможки.",
  },

  en: {
    disclaimer:
      "Sample report. The data is illustrative and the VIN and plate are masked. A real report is filled in for one specific car.",
    vinLabel: "VIN",
    vin: "KMHS381ADMU•••••",
    car: "Hyundai Santa Fe · 2021",
    updatedLabel: "Data updated",
    updated: "18.07.2026",

    summaryTitle: "Summary",
    summary: [
      { label: "Total loss", value: "No", status: "ok" },
      { label: "Theft / search", value: "No", status: "ok" },
      { label: "Flood damage", value: "No", status: "ok" },
      { label: "Commercial use", value: "Yes — taxi", status: "danger" },
      { label: "Own vehicle damage", value: "2 claims · ₩3,480,000", status: "warn" },
      { label: "Third-party damage", value: "1 claim · ₩620,400", status: "warn" },
      { label: "Ownership changes", value: "2", status: "warn" },
      { label: "Plate changes", value: "1", status: "ok" },
    ],

    specsTitle: "Specifications by VIN",
    specs: [
      ["Make", "Hyundai"],
      ["Model", "Santa Fe (TM)"],
      ["Engine displacement", "2,151 cc"],
      ["Fuel", "Diesel"],
      ["Colour", "White"],
      ["Model year", "2021"],
      ["Body", "SUV, 5 doors"],
      ["Usage class", "Private"],
      ["Manufactured", "14.03.2021"],
      ["First registration", "02.04.2021"],
    ],

    usageTitle: "Commercial operation",
    usage: [
      { label: "Rental / car-sharing", value: "No", status: "ok" },
      { label: "Taxi service", value: "Yes · 04.2021 — 08.2023", status: "danger" },
      { label: "Government fleet", value: "No", status: "ok" },
    ],

    ownersTitle: "Ownership and plate history",
    ownersCols: ["Date", "Event", "Plate", "Usage"],
    owners: [
      ["11.02.2025", "Ownership change", "72로 ••••", "Private"],
      ["30.08.2023", "Ownership and plate change", "72로 ••••", "Private"],
      ["02.04.2021", "First registration", "18바 ••••", "Taxi"],
    ],

    claimsTitle: "Insurance claims",
    claimsNote:
      "Only claims settled through insurers appear here. Cash repairs never reach this record — the inspection protocol reveals those.",
    claims: [
      {
        date: "23.11.2024",
        type: "Own vehicle damage",
        kind: "At-fault collision",
        total: "₩2,910,000",
        breakdown: [
          ["Parts", "₩1,640,000"],
          ["Labour", "₩610,000"],
          ["Paint", "₩660,000"],
        ],
        partsTitle: "Work performed",
        parts: [
          "Front left fender — replaced",
          "Front bumper — replaced and painted",
          "Bonnet — panel work and paint",
          "Left headlight — replaced",
          "Front left rail — straightened",
        ],
      },
      {
        date: "07.06.2022",
        type: "Own vehicle damage",
        kind: "Parking damage",
        total: "₩570,000",
        breakdown: [
          ["Parts", "₩180,000"],
          ["Labour", "₩140,000"],
          ["Paint", "₩250,000"],
        ],
        partsTitle: "Work performed",
        parts: ["Rear right door — painted", "Door moulding — replaced"],
      },
      {
        date: "19.09.2021",
        type: "Third-party damage",
        kind: "Payout to the other party",
        total: "₩620,400",
        partsTitle: "Work performed",
      },
    ],

    mileageTitle: "Mileage history",
    mileageCols: ["Date", "Odometer", "Source"],
    mileage: [
      ["11.02.2025", "148,320 km", "Insurance company"],
      ["30.08.2023", "121,640 km", "Used-car marketplace"],
      ["16.10.2022", "83,970 km", "Technical inspection"],
      ["07.06.2022", "61,205 km", "Insurance company"],
    ],
    mileageNote:
      "Readings only increase — no rollback. The +38,000 km over 1.5 years is typical for taxi service.",

    valueTitle: "Estimated value in Korea",
    value: "₩21,400,000 — ₩24,900,000",
    valueNote: "Insurance valuation range at the report date, excluding shipping and customs.",
  },

  ar: {
    disclaimer:
      "تقرير نموذجي. البيانات توضيحية ورقم VIN واللوحة مخفيان. التقرير الحقيقي يُملأ لسيارة محددة.",
    vinLabel: "VIN",
    vin: "KMHS381ADMU•••••",
    car: "Hyundai Santa Fe · 2021",
    updatedLabel: "تاريخ تحديث البيانات",
    updated: "18.07.2026",

    summaryTitle: "الملخص",
    summary: [
      { label: "خسارة كلية", value: "لا", status: "ok" },
      { label: "سرقة / بحث", value: "لا", status: "ok" },
      { label: "غرق", value: "لا", status: "ok" },
      { label: "استخدام تجاري", value: "نعم — أجرة", status: "danger" },
      { label: "ضرر بالسيارة نفسها", value: "حالتان · ₩3,480,000", status: "warn" },
      { label: "ضرر بسيارة أخرى", value: "حالة · ₩620,400", status: "warn" },
      { label: "تغيير الملكية", value: "مرتان", status: "warn" },
      { label: "تغيير اللوحة", value: "مرة", status: "ok" },
    ],

    specsTitle: "المواصفات حسب VIN",
    specs: [
      ["الماركة", "Hyundai"],
      ["الطراز", "Santa Fe (TM)"],
      ["سعة المحرك", "2,151 سم³"],
      ["الوقود", "ديزل"],
      ["اللون", "أبيض"],
      ["سنة الطراز", "2021"],
      ["نوع الهيكل", "دفع رباعي، 5 أبواب"],
      ["الاستخدام", "شخصي"],
      ["تاريخ التصنيع", "14.03.2021"],
      ["أول تسجيل", "02.04.2021"],
    ],

    usageTitle: "التشغيل التجاري",
    usage: [
      { label: "تأجير / مشاركة", value: "لا", status: "ok" },
      { label: "سيارة أجرة", value: "نعم · 04.2021 — 08.2023", status: "danger" },
      { label: "أسطول حكومي", value: "لا", status: "ok" },
    ],

    ownersTitle: "سجل الملكية واللوحات",
    ownersCols: ["التاريخ", "الحدث", "اللوحة", "الاستخدام"],
    owners: [
      ["11.02.2025", "تغيير الملكية", "72로 ••••", "شخصي"],
      ["30.08.2023", "تغيير الملكية واللوحة", "72로 ••••", "شخصي"],
      ["02.04.2021", "التسجيل الأول", "18바 ••••", "أجرة"],
    ],

    claimsTitle: "مطالبات التأمين",
    claimsNote:
      "تظهر هنا المطالبات المسددة عبر شركات التأمين فقط. الإصلاحات النقدية لا تُسجَّل — يكشفها بروتوكول الفحص.",
    claims: [
      {
        date: "23.11.2024",
        type: "ضرر بالسيارة نفسها",
        kind: "حادث والسائق متسبب",
        total: "₩2,910,000",
        breakdown: [
          ["قطع الغيار", "₩1,640,000"],
          ["العمالة", "₩610,000"],
          ["الدهان", "₩660,000"],
        ],
        partsTitle: "الأعمال المنفذة",
        parts: [
          "الرفرف الأمامي الأيسر — استبدال",
          "الصادم الأمامي — استبدال ودهان",
          "غطاء المحرك — سمكرة ودهان",
          "المصباح الأمامي الأيسر — استبدال",
          "العارضة الأمامية اليسرى — تقويم",
        ],
      },
      {
        date: "07.06.2022",
        type: "ضرر بالسيارة نفسها",
        kind: "ضرر في موقف السيارات",
        total: "₩570,000",
        breakdown: [
          ["قطع الغيار", "₩180,000"],
          ["العمالة", "₩140,000"],
          ["الدهان", "₩250,000"],
        ],
        partsTitle: "الأعمال المنفذة",
        parts: ["الباب الخلفي الأيمن — دهان", "شريط الباب — استبدال"],
      },
      {
        date: "19.09.2021",
        type: "ضرر بسيارة أخرى",
        kind: "تعويض للطرف الآخر",
        total: "₩620,400",
        partsTitle: "الأعمال المنفذة",
      },
    ],

    mileageTitle: "سجل المسافة",
    mileageCols: ["التاريخ", "العداد", "المصدر"],
    mileage: [
      ["11.02.2025", "148,320 كم", "شركة التأمين"],
      ["30.08.2023", "121,640 كم", "منصة بيع السيارات"],
      ["16.10.2022", "83,970 كم", "الفحص الفني"],
      ["07.06.2022", "61,205 كم", "شركة التأمين"],
    ],
    mileageNote: "القراءات تتزايد فقط — لا تلاعب بالعداد.",

    valueTitle: "القيمة التقديرية في كوريا",
    value: "₩21,400,000 — ₩24,900,000",
    valueNote: "نطاق تقييم التأمين بتاريخ التقرير، دون الشحن والجمارك.",
  },
};

function StatusIcon({ status }: { status: Status }) {
  if (status === "ok") return <CheckCircle2 className="w-4 h-4 shrink-0" />;
  if (status === "danger") return <AlertTriangle className="w-4 h-4 shrink-0" />;
  return <AlertTriangle className="w-4 h-4 shrink-0" />;
}

export function ReportExample({ lang }: { lang: GuideLocale }) {
  const d = DATA[lang];

  return (
    <div className="rounded-2xl border border-border bg-base-darker overflow-hidden">
      {/* Шапка отчёта */}
      <div className="px-6 sm:px-8 py-6 border-b border-border-subtle bg-elevated">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Car className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold font-[family-name:var(--font-heading)] text-text">
                {d.car}
              </span>
            </div>
            <div className="text-sm text-text-muted font-mono">
              {d.vinLabel}: {d.vin}
            </div>
          </div>
          <div className="text-xs text-text-dim">
            {d.updatedLabel}: {d.updated}
          </div>
        </div>
      </div>

      {/* Плашка «это пример» */}
      <div className="px-6 sm:px-8 py-3 bg-cta/10 border-b border-cta/20 text-xs text-cta leading-relaxed">
        {d.disclaimer}
      </div>

      <div className="p-6 sm:p-8 space-y-10">
        {/* Сводка */}
        <div>
          <SectionTitle icon={FileText} text={d.summaryTitle} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {d.summary.map((s) => (
              <div
                key={s.label}
                className={`rounded-xl border p-4 ${STATUS_STYLES[s.status]}`}
              >
                <div className="flex items-start gap-2">
                  <StatusIcon status={s.status} />
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide opacity-80 leading-tight">
                      {s.label}
                    </div>
                    <div className="text-sm font-semibold mt-1 leading-snug">{s.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Характеристики + коммерческое использование */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <SectionTitle icon={Car} text={d.specsTitle} />
            <dl className="divide-y divide-border-subtle text-sm rounded-xl border border-border-subtle overflow-hidden">
              {d.specs.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 px-4 py-2.5 bg-elevated/40">
                  <dt className="text-text-muted">{k}</dt>
                  <dd className="font-medium text-text text-end">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <SectionTitle icon={AlertTriangle} text={d.usageTitle} />
            <div className="space-y-3">
              {d.usage.map((u) => (
                <div
                  key={u.label}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${STATUS_STYLES[u.status]}`}
                >
                  <span className="opacity-90">{u.label}</span>
                  <span className="font-semibold text-end">{u.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <SectionTitle icon={Coins} text={d.valueTitle} />
              <div className="rounded-xl border border-border-subtle bg-elevated/40 px-4 py-4">
                <div className="text-lg font-bold font-[family-name:var(--font-heading)] text-primary">
                  {d.value}
                </div>
                <p className="text-xs text-text-muted mt-1.5 leading-relaxed">{d.valueNote}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Владельцы и номера */}
        <div>
          <SectionTitle icon={FileText} text={d.ownersTitle} />
          <div className="overflow-x-auto rounded-xl border border-border-subtle">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="bg-elevated text-text-muted text-xs uppercase tracking-wide">
                  {d.ownersCols.map((c) => (
                    <th key={c} className="px-4 py-2.5 text-start font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {d.owners.map((row, i) => (
                  <tr key={i} className="bg-elevated/30">
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`px-4 py-2.5 ${j === 0 ? "text-text-muted whitespace-nowrap" : "text-text"}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Страховые случаи */}
        <div>
          <SectionTitle icon={Wrench} text={d.claimsTitle} />
          <div className="space-y-4">
            {d.claims.map((c, i) => (
              <div key={i} className="rounded-xl border border-border-subtle overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-elevated border-b border-border-subtle">
                  <div>
                    <div className="text-sm font-semibold text-text">{c.type}</div>
                    {c.kind && <div className="text-xs text-text-muted mt-0.5">{c.kind}</div>}
                  </div>
                  <div className="text-end">
                    <div className="text-xs text-text-dim">{c.date}</div>
                    <div className="text-base font-bold text-cta font-[family-name:var(--font-heading)]">
                      {c.total}
                    </div>
                  </div>
                </div>

                {(c.breakdown || c.parts) && (
                  <div className="px-5 py-4 bg-elevated/30 grid sm:grid-cols-2 gap-5">
                    {c.breakdown && (
                      <dl className="space-y-1.5 text-sm">
                        {c.breakdown.map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-3">
                            <dt className="text-text-muted">{k}</dt>
                            <dd className="text-text font-medium">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {c.parts && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
                          {c.partsTitle}
                        </div>
                        <ul className="space-y-1.5 text-sm text-text-secondary">
                          {c.parts.map((p) => (
                            <li key={p} className="flex gap-2">
                              <span className="text-cta">•</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-3 leading-relaxed">{d.claimsNote}</p>
        </div>

        {/* Пробег */}
        <div>
          <SectionTitle icon={Gauge} text={d.mileageTitle} />
          <div className="overflow-x-auto rounded-xl border border-border-subtle">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="bg-elevated text-text-muted text-xs uppercase tracking-wide">
                  {d.mileageCols.map((c) => (
                    <th key={c} className="px-4 py-2.5 text-start font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {d.mileage.map((row, i) => (
                  <tr key={i} className="bg-elevated/30">
                    <td className="px-4 py-2.5 text-text-muted whitespace-nowrap">{row[0]}</td>
                    <td className="px-4 py-2.5 text-text font-semibold">{row[1]}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-muted mt-3 leading-relaxed">{d.mileageNote}</p>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  text,
}: {
  icon: typeof FileText;
  text: string;
}) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text mb-4">
      <Icon className="w-4 h-4 text-primary" />
      {text}
    </h3>
  );
}

/** Флаг «есть ли затопление» и т.п. — для превью-карточек вне отчёта. */
export const REPORT_SECTION_COUNT = 8;
