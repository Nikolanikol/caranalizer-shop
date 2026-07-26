// Демонстрационный отчёт в том же виде, в каком его отдаёт приложение:
// светлый документ с нумерованными секциями. Цвета здесь заданы явно, а не
// токенами темы — блок обязан оставаться светлым внутри тёмного сайта.
// Данные вымышленные, госномер частично скрыт; плашка об этом обязательна.
import type { GuideLocale } from "@/lib/guides";

type Mark = "paint" | "remove" | "both";

interface Claim {
  date: string;
  /** В какой блок попадает случай: своё ДТП или ДТП другой стороны */
  own: boolean;
  /** Какой страховкой покрыт: своя или другой стороны */
  byOwnInsurance: boolean;
  badge?: string;
  total: string;
  breakdown?: [string, string][];
  historyBtn?: string;
}

interface ReportData {
  disclaimer: string;
  title: string;
  plate: string;
  updatedLabel: string;
  updated: string;

  s1: string;
  overview: { label: string; value: string; note?: string; icon: string }[];
  overviewNote: string;

  s2: string;
  s2sub: string;
  specsLeft: [string, string][];
  specsRight: [string, string][];

  s3: string;
  s3sub: string;
  special: { label: string; value: string; icon: string }[];

  s4: string;
  s4note: string;
  ownersCols: string[];
  owners: { date: string; event: string; plate: string; purpose: string; end?: boolean }[];

  s5: string;
  s5sub: string;
  loss: { label: string; value: string; icon: string }[];
  s5notes: [string, string][];

  s6: string;
  s6plateNote: string;
  gapLabel: string;
  s6intro: string[];
  diagramCols: [string, string];
  legend: [string, string, string];
  areasLeft: { name: string; mark?: Mark }[];
  areasRight: { name: string; mark?: Mark }[];
  summary: [string, string][];
  allHistoryBtn: string;
  ownCrashTitle: string;
  otherCrashTitle: string;
  ownInsurance: string;
  otherInsurance: string;
  repairCostLabel: string;
  claims: Claim[];
  s6bullets: string[];
  s6notes: [string, string][];

  s7: string;
  mileageCols: string[];
  mileage: string[][];

  noteLabel: string;
}

const ICONS: Record<string, string> = {
  loss: "M3 13h18M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13v4H5v-4Z",
  theft: "M4 4l16 16M9 11V8a3 3 0 0 1 6 0v3M6 11h12v9H6z",
  flood: "M3 17c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2M5 12h14l-1.5-4.5A2 2 0 0 0 15.6 6H8.4a2 2 0 0 0-1.9 1.5L5 12Z",
  taxi: "M5 17h14M7 17v2M17 17v2M5 13h14l-1.5-4.5A2 2 0 0 0 15.6 7H8.4a2 2 0 0 0-1.9 1.5L5 13Zm4-8h6",
  damage: "M13 2 4.5 13H11l-1 9 8.5-11H12l1-9Z",
  damage2: "M12 2 3 7v6c0 5 3.8 8.5 9 9 5.2-.5 9-4 9-9V7l-9-5Z",
  owner: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20a6 6 0 0 1 12 0M14 20a6 6 0 0 1 8-5",
  plate: "M3 7h18v10H3zM7 11h2M11 11h2M15 11h2",
  gov: "M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6",
};

const MARK_STYLE: Record<Mark, { bg: string; color: string }> = {
  paint: { bg: "#fde8ec", color: "#c2185b" },
  remove: { bg: "#e3f0fb", color: "#1565c0" },
  both: { bg: "#fdf3d8", color: "#a26b00" },
};

const DATA: Record<GuideLocale, ReportData> = {
  ru: {
    disclaimer:
      "Пример отчёта. Данные демонстрационные, госномер частично скрыт — в реальном отчёте все поля заполнены по конкретному автомобилю.",
    title: "Sorento / 37머5182",
    plate: "37머5182",
    updatedLabel: "Последнее изменение",
    updated: "2026-07-18",

    s1: "Общие сведения",
    overview: [
      { label: "Полная гибель", value: "Нет", icon: "loss" },
      { label: "Угон авто", value: "Нет", icon: "theft" },
      { label: "Затопление", value: "1", note: "запись", icon: "flood" },
      { label: "Особое использование", value: "Да", icon: "taxi" },
      { label: "Повреждение автомобиля", value: "2", note: "записи (9,756,400 ₩)", icon: "damage" },
      { label: "Повреждение автомобиля оппонента", value: "1", note: "запись (452,300 ₩)", icon: "damage2" },
      { label: "Смена владельца", value: "2", note: "записи", icon: "owner" },
      { label: "Смена номера автомобиля", value: "1", note: "запись", icon: "plate" },
    ],
    overviewNote: "Отсутствие записей о ДТП не означает, что автомобиль не имеет повреждений",

    s2: "Подробные сведения об автомобиле",
    s2sub: "Общая информация о характеристиках автомобиля",
    specsLeft: [
      ["Производитель", "Kia"],
      ["Модель", "Sorento"],
      ["Объем двигателя", "2,151см3"],
      ["Топливо", "дизель"],
      ["Цвет", "Белый"],
    ],
    specsRight: [
      ["Модельный год", "2021"],
      ["Тип кузова", "SUV 5 дверей"],
      ["Использование", "личное"],
      ["Дата производства", "12.03.2021"],
      ["Первая регистрация", "06.04.2021"],
    ],

    s3: "История специального использования",
    s3sub: "Использование авто в аренде (каршеринге), работа автомобиля в такси и на государственной службе.",
    special: [
      { label: "Коммерческое использование", value: "Нет", icon: "theft" },
      { label: "Работа в такси", value: "да", icon: "taxi" },
      { label: "Использование в правительстве", value: "Нет", icon: "gov" },
    ],

    s4: "Смена номера автомобиля / владельца",
    s4note:
      "Обратите внимание, что информация об истории смены владельца включает все изменения между физическими лицами и организациями",
    ownersCols: ["Дата регистрации", "Событие", "Гос. номер", "Цель использования автомобиля"],
    owners: [
      { date: "2026-05-22", event: "Конец предоставления информации", plate: "-", purpose: "-", end: true },
      { date: "2024-11-08", event: "Смена номера", plate: "37머XXXX", purpose: "Личное пользование" },
      { date: "2024-10-30", event: "Смена владельца", plate: "-", purpose: "Личное пользование" },
      { date: "2023-02-14", event: "Смена владельца", plate: "51호XXXX", purpose: "Личное пользование" },
      { date: "2021-04-06", event: "Первоначальная регистрация", plate: "82바XXXX", purpose: "Работа в такси" },
    ],

    s5: "Информация о затоплении, уничтожении, краже",
    s5sub: "Страховые случаи, которые могут оказать особое влияние на качество автомобиля.",
    loss: [
      { label: "Полная гибель", value: "Нет", icon: "loss" },
      { label: "Угон авто", value: "Нет", icon: "theft" },
      { label: "Затопление", value: "2023-08-11", icon: "flood" },
    ],
    s5notes: [
      [
        "Полная гибель",
        "Если стоимость ремонта повреждённого автомобиля превышает стоимость автомобиля или ремонт повреждённого автомобиля невозможен, автомобиль считается погибшим",
      ],
      [
        "Угон авто",
        "Страховой случай, при котором угнанный автомобиль не был найден в течение 30 дней после сообщения в полицию, и страховка автомобиля возместила ущерб.",
      ],
      ["Затопление", "Страховой случай, при котором вода попадает в автомобиль."],
    ],

    s6: "История страховых случаев",
    s6plateNote:
      "37머5182 Невозможно предоставить информацию о наличии ДТП автомобиля, пока автомобиль не застрахован",
    gapLabel: "Период отсутствия регистрации : 11.2024~12.2024",
    s6intro: [
      "В зависимости от источника страховой выплаты и Затрат на ремонт (предварительная оценка) страховые случаи делятся на «оплаченные страховой компанией, с которой вы оформили договор (автострахование)» и «оплаченные страховкой другого транспортного средства (страхование другой стороны)».",
      "* Если запись о повреждении и ремонте автомобиля одновременно обрабатывается в моей страховке автомобиля и страховке другой стороны по обоюдной вине, она будет отображаться только в разделе «Страхование моего автомобиля» и опущена в разделе «Страхование другой стороны».",
    ],
    diagramCols: ["Область ремонта", "Сводная информация"],
    legend: ["Покраска", "Демонтаж", "Покраска+Демонтаж"],
    areasLeft: [
      { name: "Передний бампер", mark: "both" },
      { name: "Задний бампер" },
      { name: "Капот", mark: "paint" },
      { name: "Решетка багажника" },
      { name: "Передняя дверь (левая)", mark: "paint" },
      { name: "Передняя дверь (правая)" },
      { name: "Задняя дверь (левая)" },
      { name: "Задняя дверь (правая)", mark: "remove" },
      { name: "Переднее крыло (левая)", mark: "both" },
      { name: "Переднее крыло (правая)" },
      { name: "Заднее крыло (левая)" },
      { name: "Заднее крыло (правая)", mark: "paint" },
      { name: "Ветровое стекло" },
    ],
    areasRight: [
      { name: "Люк в крыше" },
      { name: "Петля" },
      { name: "Раздвижная дверь (левая)" },
      { name: "Раздвижная дверь (правая)", mark: "remove" },
      { name: "Заднее стекло" },
      { name: "Решетка радиатора", mark: "paint" },
      { name: "Фары(левая)", mark: "remove" },
      { name: "Фары(правая)" },
      { name: "Задний комбинированный фонарь (левая)" },
      { name: "Задний комбинированный фонарь (правая)" },
      { name: "Боковая ступенька(левая)" },
      { name: "Боковая ступенька(правая)" },
      { name: "Центральный наполнитель (левая)" },
      { name: "Центральный наполнитель(правая)" },
    ],
    summary: [
      ["Покраска", "4"],
      ["Демонтаж", "3"],
      ["Замена", "2"],
      ["Листовая сталь", "1"],
      ["Ремонт", "2"],
      ["Прочее", "3"],
    ],
    allHistoryBtn: "ВСЯ ИСТОРИЯ",
    ownCrashTitle: "ДТП с участием моего автомобиля",
    otherCrashTitle: "ДТП с участием автомобиля другой стороны",
    ownInsurance: "Страхование моего автомобиля",
    otherInsurance: "Страхование другой стороны",
    repairCostLabel: "Затраты на ремонт (предварительная оценка) :",
    claims: [
      {
        date: "2023-08-11",
        own: true,
        byOwnInsurance: true,
        badge: "Ущерб от затопления",
        total: "8,470,000 ₩",
      },
      {
        date: "2022-05-27",
        own: true,
        byOwnInsurance: false,
        total: "1,286,400 ₩",
        breakdown: [
          ["Запчасти", "612,300 ₩"],
          ["Работа", "298,700 ₩"],
          ["Покраска", "375,400 ₩"],
        ],
        historyBtn: "ИСТОРИЯ РЕМОНТА",
      },
      {
        date: "2021-11-19",
        own: false,
        byOwnInsurance: true,
        total: "452,300 ₩",
      },
    ],
    s6bullets: [
      "Ввиду метода сбора данных автомобиля информация может быть неполной. Если у вас есть какие-либо сомнения, пожалуйста, проконсультируйтесь с нами.",
      "Вышеупомянутые «затраты на ремонт (предварительная оценка)» отличаются от фактического страхового возмещения, выплачиваемого страховой компанией в силу затрат на ремонт и оценку (запчасти, оплата труда, покраска), за исключением косвенного ущерба и ущерба по обоюдной вине (ущерб от арендатора автомобиля, ущерб от простоя).",
      "Вышеупомянутая «информация об истории ремонта» предоставляется только в том случае, если имеются данные о ремонтных работах по страховке аварийного транспортного средства.",
    ],
    s6notes: [
      [
        "Затраты на ремонт (предварительная оценка)",
        "В случае повреждения автомобиля в результате ДТП стоимость ремонта автомобиля за исключением косвенного ущерба и ущерба по обоюдной вине (ущерб при транспортировке, ущерб от арендатора автомобиля, ущерб от простоя) из страховых выплат, предоставляемых страховой компанией.",
      ],
      [
        "Неподтвержденная авария",
        "Происшествие, которое ещё не было подтверждено или не окончательно оформлено и обработано, поскольку соответствующие данные ещё не переданы в Корейский институт развития страхования (отправка раз в месяц, занимает 2-3 месяца).",
      ],
      [
        "Период отсутствия регистрации",
        "Период времени, за который не может быть предоставлена информация о страховых выплатах на ремонт автомобиля в связи с отсутствием страхования транспортного средства от повреждений.",
      ],
      [
        "Страхование моего автомобиля",
        "ДТП, покрываемое личной страховкой (за исключением несчастного случая).",
      ],
      [
        "Страхование другой стороны",
        "ДТП, покрываемое страховкой другого транспортного средства (за исключением несчастного случая).",
      ],
      [
        "ДТП с участием автомобиля другой стороны",
        "ДТП, в котором ущерб автомобиля другого лица покрывается вашей личной страховкой.",
      ],
    ],

    s7: "История пробега",
    mileageCols: ["Дата", "Пробег", "Источник"],
    mileage: [
      ["2024-10-30", "132,480 Km", "Страховая компания"],
      ["2023-08-11", "98,215 Km", "Страховая компания"],
      ["2022-09-04", "71,630 Km", "Площадка продажи авто"],
      ["2021-11-19", "42,905 Km", "Страховая компания"],
    ],


    noteLabel: "Примечание",
  },

  en: {
    disclaimer:
      "Sample report. The data is illustrative and the plate is partly masked — a real report is filled in for one specific car.",
    title: "Sorento / 37머5182",
    plate: "37머5182",
    updatedLabel: "Last updated",
    updated: "2026-07-18",

    s1: "General information",
    overview: [
      { label: "Total loss", value: "No", icon: "loss" },
      { label: "Vehicle theft", value: "No", icon: "theft" },
      { label: "Flooding", value: "1", note: "record", icon: "flood" },
      { label: "Special use", value: "Yes", icon: "taxi" },
      { label: "Vehicle damage", value: "2", note: "records (₩9,756,400)", icon: "damage" },
      { label: "Opponent vehicle damage", value: "1", note: "record (₩452,300)", icon: "damage2" },
      { label: "Ownership change", value: "2", note: "records", icon: "owner" },
      { label: "License plate change", value: "1", note: "record", icon: "plate" },
    ],
    overviewNote: "The absence of accident records does not mean the vehicle is undamaged",

    s2: "Vehicle details",
    s2sub: "General information about the vehicle specifications",
    specsLeft: [
      ["Manufacturer", "Kia"],
      ["Model", "Sorento"],
      ["Engine displacement", "2,151 cc"],
      ["Fuel", "diesel"],
      ["Colour", "White"],
    ],
    specsRight: [
      ["Model year", "2021"],
      ["Body type", "SUV 5-door"],
      ["Usage", "personal"],
      ["Manufacturing date", "12.03.2021"],
      ["First registration", "06.04.2021"],
    ],

    s3: "Special usage history",
    s3sub: "Rental (car-sharing) use, taxi operation and government service.",
    special: [
      { label: "Commercial use", value: "No", icon: "theft" },
      { label: "Taxi operation", value: "yes", icon: "taxi" },
      { label: "Government use", value: "No", icon: "gov" },
    ],

    s4: "License plate / ownership changes",
    s4note:
      "Note that the ownership history includes all changes between private individuals and organisations",
    ownersCols: ["Registration date", "Event", "Plate", "Usage purpose"],
    owners: [
      { date: "2026-05-22", event: "Information provision ended", plate: "-", purpose: "-", end: true },
      { date: "2024-11-08", event: "Plate change", plate: "37머XXXX", purpose: "Personal use" },
      { date: "2024-10-30", event: "Ownership change", plate: "-", purpose: "Personal use" },
      { date: "2023-02-14", event: "Ownership change", plate: "51호XXXX", purpose: "Personal use" },
      { date: "2021-04-06", event: "Initial registration", plate: "82바XXXX", purpose: "Taxi operation" },
    ],

    s5: "Flooding, total loss and theft",
    s5sub: "Insurance events that particularly affect the quality of the vehicle.",
    loss: [
      { label: "Total loss", value: "No", icon: "loss" },
      { label: "Vehicle theft", value: "No", icon: "theft" },
      { label: "Flooding", value: "2023-08-11", icon: "flood" },
    ],
    s5notes: [
      [
        "Total loss",
        "If the repair cost exceeds the value of the vehicle, or repair is impossible, the vehicle is written off as a total loss.",
      ],
      [
        "Vehicle theft",
        "An insurance event where a stolen vehicle was not recovered within 30 days of the police report and the insurer paid out.",
      ],
      ["Flooding", "An insurance event where water entered the vehicle."],
    ],

    s6: "Insurance claims history",
    s6plateNote:
      "37머5182 Accident information cannot be provided for periods when the vehicle was not insured",
    gapLabel: "Non-coverage period: 11.2024~12.2024",
    s6intro: [
      "Depending on the source of the payout and the estimated repair cost, claims are split into those paid by your own insurer (own vehicle insurance) and those paid by the other vehicle's insurer (third-party insurance).",
      "* If a damage and repair record is processed simultaneously under both your own and the other party's insurance due to shared fault, it appears only under «Own vehicle insurance» and is omitted from «Third-party insurance».",
    ],
    diagramCols: ["Repair area", "Summary"],
    legend: ["Paint", "Removal", "Paint + removal"],
    areasLeft: [
      { name: "Front bumper", mark: "both" },
      { name: "Rear bumper" },
      { name: "Bonnet", mark: "paint" },
      { name: "Tailgate frame" },
      { name: "Front door (left)", mark: "paint" },
      { name: "Front door (right)" },
      { name: "Rear door (left)" },
      { name: "Rear door (right)", mark: "remove" },
      { name: "Front fender (left)", mark: "both" },
      { name: "Front fender (right)" },
      { name: "Rear fender (left)" },
      { name: "Rear fender (right)", mark: "paint" },
      { name: "Windscreen" },
    ],
    areasRight: [
      { name: "Sunroof" },
      { name: "Hinge" },
      { name: "Sliding door (left)" },
      { name: "Sliding door (right)", mark: "remove" },
      { name: "Rear window" },
      { name: "Radiator grille", mark: "paint" },
      { name: "Headlight (left)", mark: "remove" },
      { name: "Headlight (right)" },
      { name: "Rear combination light (left)" },
      { name: "Rear combination light (right)" },
      { name: "Side step (left)" },
      { name: "Side step (right)" },
      { name: "Centre filler (left)" },
      { name: "Centre filler (right)" },
    ],
    summary: [
      ["Paint", "4"],
      ["Removal", "3"],
      ["Replacement", "2"],
      ["Sheet metal", "1"],
      ["Repair", "2"],
      ["Other", "3"],
    ],
    allHistoryBtn: "FULL HISTORY",
    ownCrashTitle: "Accident involving my vehicle",
    otherCrashTitle: "Accident involving the other party's vehicle",
    ownInsurance: "Own vehicle insurance",
    otherInsurance: "Third-party insurance",
    repairCostLabel: "Estimated repair cost:",
    claims: [
      {
        date: "2023-08-11",
        own: true,
        byOwnInsurance: true,
        badge: "Flood damage",
        total: "₩8,470,000",
      },
      {
        date: "2022-05-27",
        own: true,
        byOwnInsurance: false,
        total: "₩1,286,400",
        breakdown: [
          ["Parts", "₩612,300"],
          ["Labour", "₩298,700"],
          ["Paint", "₩375,400"],
        ],
        historyBtn: "REPAIR HISTORY",
      },
      {
        date: "2021-11-19",
        own: false,
        byOwnInsurance: true,
        total: "₩452,300",
      },
    ],
    s6bullets: [
      "Due to the data collection method the information may be incomplete. If you have any doubts, please consult us.",
      "The «estimated repair cost» above differs from the actual settlement paid by the insurer: it covers parts, labour and paint, and excludes consequential losses and shared-fault damages (rental loss, downtime).",
      "The «repair history» above is provided only where repair records exist under the damaged vehicle's insurance.",
    ],
    s6notes: [
      [
        "Estimated repair cost",
        "The cost of repairing the vehicle after an accident, excluding consequential and shared-fault losses (transport damage, rental loss, downtime), out of the payout provided by the insurer.",
      ],
      [
        "Unconfirmed accident",
        "An event not yet confirmed or fully processed because the data has not yet been passed to the Korea Insurance Development Institute (sent monthly, takes 2–3 months).",
      ],
      [
        "Non-coverage period",
        "A period for which repair payout information cannot be provided because the vehicle had no damage insurance.",
      ],
      ["Own vehicle insurance", "An accident covered by your own policy (excluding personal injury)."],
      [
        "Third-party insurance",
        "An accident covered by the other vehicle's policy (excluding personal injury).",
      ],
      [
        "Accident involving the other party's vehicle",
        "An accident in which damage to another person's vehicle is covered by your own policy.",
      ],
    ],

    s7: "Mileage history",
    mileageCols: ["Date", "Mileage", "Source"],
    mileage: [
      ["2024-10-30", "132,480 Km", "Insurance company"],
      ["2023-08-11", "98,215 Km", "Insurance company"],
      ["2022-09-04", "71,630 Km", "Used car trading centre"],
      ["2021-11-19", "42,905 Km", "Insurance company"],
    ],


    noteLabel: "Note",
  },

  ar: {
    disclaimer:
      "تقرير نموذجي. البيانات توضيحية واللوحة مخفية جزئياً — التقرير الحقيقي يُملأ لسيارة محددة.",
    title: "Sorento / 37머5182",
    plate: "37머5182",
    updatedLabel: "آخر تحديث",
    updated: "2026-07-18",

    s1: "معلومات عامة",
    overview: [
      { label: "خسارة كلية", value: "لا", icon: "loss" },
      { label: "سرقة السيارة", value: "لا", icon: "theft" },
      { label: "الغرق", value: "1", note: "سجل", icon: "flood" },
      { label: "استخدام خاص", value: "نعم", icon: "taxi" },
      { label: "ضرر بالسيارة", value: "2", note: "سجلان (₩9,756,400)", icon: "damage" },
      { label: "ضرر بسيارة الطرف الآخر", value: "1", note: "سجل (₩452,300)", icon: "damage2" },
      { label: "تغيير الملكية", value: "2", note: "سجلان", icon: "owner" },
      { label: "تغيير اللوحة", value: "1", note: "سجل", icon: "plate" },
    ],
    overviewNote: "غياب سجلات الحوادث لا يعني أن السيارة خالية من الأضرار",

    s2: "تفاصيل السيارة",
    s2sub: "معلومات عامة عن مواصفات السيارة",
    specsLeft: [
      ["الشركة المصنعة", "Kia"],
      ["الطراز", "Sorento"],
      ["سعة المحرك", "2,151 سم³"],
      ["الوقود", "ديزل"],
      ["اللون", "أبيض"],
    ],
    specsRight: [
      ["سنة الطراز", "2021"],
      ["نوع الهيكل", "SUV 5 أبواب"],
      ["الاستخدام", "شخصي"],
      ["تاريخ التصنيع", "12.03.2021"],
      ["أول تسجيل", "06.04.2021"],
    ],

    s3: "سجل الاستخدام الخاص",
    s3sub: "الاستخدام في التأجير والمشاركة والعمل كسيارة أجرة وفي الخدمة الحكومية.",
    special: [
      { label: "استخدام تجاري", value: "لا", icon: "theft" },
      { label: "العمل كسيارة أجرة", value: "نعم", icon: "taxi" },
      { label: "استخدام حكومي", value: "لا", icon: "gov" },
    ],

    s4: "تغيير اللوحة / الملكية",
    s4note: "يشمل سجل تغيير الملكية جميع التغييرات بين الأفراد والمؤسسات",
    ownersCols: ["تاريخ التسجيل", "الحدث", "اللوحة", "غرض الاستخدام"],
    owners: [
      { date: "2026-05-22", event: "انتهاء تقديم المعلومات", plate: "-", purpose: "-", end: true },
      { date: "2024-11-08", event: "تغيير اللوحة", plate: "37머XXXX", purpose: "استخدام شخصي" },
      { date: "2024-10-30", event: "تغيير الملكية", plate: "-", purpose: "استخدام شخصي" },
      { date: "2023-02-14", event: "تغيير الملكية", plate: "51호XXXX", purpose: "استخدام شخصي" },
      { date: "2021-04-06", event: "التسجيل الأول", plate: "82바XXXX", purpose: "سيارة أجرة" },
    ],

    s5: "الغرق والخسارة الكلية والسرقة",
    s5sub: "حالات التأمين التي تؤثر بشكل خاص على جودة السيارة.",
    loss: [
      { label: "خسارة كلية", value: "لا", icon: "loss" },
      { label: "سرقة السيارة", value: "لا", icon: "theft" },
      { label: "الغرق", value: "2023-08-11", icon: "flood" },
    ],
    s5notes: [
      [
        "خسارة كلية",
        "إذا تجاوزت تكلفة الإصلاح قيمة السيارة أو تعذّر الإصلاح، تُعتبر السيارة خسارة كلية.",
      ],
      [
        "سرقة السيارة",
        "حالة لم يتم فيها العثور على السيارة المسروقة خلال 30 يوماً من البلاغ ودفع التأمين التعويض.",
      ],
      ["الغرق", "حالة تأمينية دخل فيها الماء إلى السيارة."],
    ],

    s6: "سجل مطالبات التأمين",
    s6plateNote: "37머5182 لا يمكن تقديم معلومات الحوادث عن الفترات التي لم تكن السيارة مؤمّنة فيها",
    gapLabel: "فترة عدم التغطية: 11.2024~12.2024",
    s6intro: [
      "بحسب مصدر التعويض وتكلفة الإصلاح التقديرية، تنقسم الحالات إلى ما تدفعه شركة تأمينك وما تدفعه شركة تأمين الطرف الآخر.",
      "* إذا عولج سجل الضرر والإصلاح لدى الطرفين بسبب الخطأ المشترك، فإنه يظهر في قسم «تأمين سيارتي» فقط.",
    ],
    diagramCols: ["منطقة الإصلاح", "الملخص"],
    legend: ["دهان", "فك", "دهان + فك"],
    areasLeft: [
      { name: "الصادم الأمامي", mark: "both" },
      { name: "الصادم الخلفي" },
      { name: "غطاء المحرك", mark: "paint" },
      { name: "إطار الباب الخلفي" },
      { name: "الباب الأمامي (يسار)", mark: "paint" },
      { name: "الباب الأمامي (يمين)" },
      { name: "الباب الخلفي (يسار)" },
      { name: "الباب الخلفي (يمين)", mark: "remove" },
      { name: "الرفرف الأمامي (يسار)", mark: "both" },
      { name: "الرفرف الأمامي (يمين)" },
      { name: "الرفرف الخلفي (يسار)" },
      { name: "الرفرف الخلفي (يمين)", mark: "paint" },
      { name: "الزجاج الأمامي" },
    ],
    areasRight: [
      { name: "فتحة السقف" },
      { name: "المفصلة" },
      { name: "الباب المنزلق (يسار)" },
      { name: "الباب المنزلق (يمين)", mark: "remove" },
      { name: "الزجاج الخلفي" },
      { name: "شبك الرادياتير", mark: "paint" },
      { name: "المصباح الأمامي (يسار)", mark: "remove" },
      { name: "المصباح الأمامي (يمين)" },
      { name: "المصباح الخلفي (يسار)" },
      { name: "المصباح الخلفي (يمين)" },
      { name: "العتبة الجانبية (يسار)" },
      { name: "العتبة الجانبية (يمين)" },
      { name: "الحشوة الوسطى (يسار)" },
      { name: "الحشوة الوسطى (يمين)" },
    ],
    summary: [
      ["دهان", "4"],
      ["فك", "3"],
      ["استبدال", "2"],
      ["صفائح معدنية", "1"],
      ["إصلاح", "2"],
      ["أخرى", "3"],
    ],
    allHistoryBtn: "السجل الكامل",
    ownCrashTitle: "حادث بمشاركة سيارتي",
    otherCrashTitle: "حادث بمشاركة سيارة الطرف الآخر",
    ownInsurance: "تأمين سيارتي",
    otherInsurance: "تأمين الطرف الآخر",
    repairCostLabel: "تكلفة الإصلاح التقديرية:",
    claims: [
      {
        date: "2023-08-11",
        own: true,
        byOwnInsurance: true,
        badge: "ضرر الغرق",
        total: "₩8,470,000",
      },
      {
        date: "2022-05-27",
        own: true,
        byOwnInsurance: false,
        total: "₩1,286,400",
        breakdown: [
          ["قطع الغيار", "₩612,300"],
          ["العمالة", "₩298,700"],
          ["الدهان", "₩375,400"],
        ],
        historyBtn: "سجل الإصلاح",
      },
      {
        date: "2021-11-19",
        own: false,
        byOwnInsurance: true,
        total: "₩452,300",
      },
    ],
    s6bullets: [
      "قد تكون المعلومات ناقصة بسبب طريقة جمع البيانات. إذا كان لديك أي شك فاستشرنا.",
      "«تكلفة الإصلاح التقديرية» تختلف عن التعويض الفعلي: تشمل القطع والعمالة والدهان وتستثني الأضرار غير المباشرة والخطأ المشترك.",
      "«سجل الإصلاح» يُقدَّم فقط عند توفر بيانات أعمال الإصلاح ضمن تأمين السيارة المتضررة.",
    ],
    s6notes: [
      [
        "تكلفة الإصلاح التقديرية",
        "تكلفة إصلاح السيارة بعد الحادث باستثناء الأضرار غير المباشرة والخطأ المشترك من التعويض المقدم من شركة التأمين.",
      ],
      [
        "حادث غير مؤكد",
        "حادث لم يُؤكد أو يُعالج نهائياً لأن البيانات لم تُرسل بعد إلى المعهد الكوري لتطوير التأمين (شهرياً، ويستغرق 2-3 أشهر).",
      ],
      [
        "فترة عدم التغطية",
        "فترة لا يمكن تقديم معلومات التعويضات عنها لعدم وجود تأمين ضد الأضرار.",
      ],
      ["تأمين سيارتي", "حادث تغطيه وثيقتك الشخصية (باستثناء الإصابات)."],
      ["تأمين الطرف الآخر", "حادث تغطيه وثيقة السيارة الأخرى (باستثناء الإصابات)."],
      [
        "حادث بمشاركة سيارة الطرف الآخر",
        "حادث يُغطى فيه الضرر اللاحق بسيارة شخص آخر بوثيقتك الشخصية.",
      ],
    ],

    s7: "سجل المسافة",
    mileageCols: ["التاريخ", "المسافة", "المصدر"],
    mileage: [
      ["2024-10-30", "132,480 كم", "شركة التأمين"],
      ["2023-08-11", "98,215 كم", "شركة التأمين"],
      ["2022-09-04", "71,630 كم", "مركز بيع السيارات"],
      ["2021-11-19", "42,905 كم", "شركة التأمين"],
    ],


    noteLabel: "ملاحظة",
  },
};

/* ────────────────────────── строительные блоки ────────────────────────── */

function SectionBar({ n, text }: { n: number; text: string }) {
  return (
    <div className="bg-[#3a3a3a] text-white px-5 py-3 text-[15px]">
      <span className="font-bold">{n}.</span> <span className="font-normal">{text}</span>
    </div>
  );
}

function Icon({ name }: { name: string }) {
  return (
    <div className="w-[62px] h-[62px] rounded-full bg-[#f2f4f6] flex items-center justify-center mx-auto mb-2.5">
      <svg
        viewBox="0 0 24 24"
        className="w-8 h-8"
        fill="none"
        stroke="#4a90d9"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={ICONS[name] ?? ICONS.damage} />
      </svg>
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note?: string;
  icon: string;
}) {
  return (
    <div className="border border-[#e3e6ea] px-3 py-5 text-center">
      <Icon name={icon} />
      <div className="text-[13px] text-[#333] leading-snug mb-1">{label}</div>
      <div className="text-[#111]">
        <span className="text-[17px] font-bold">{value}</span>
        {note && <span className="text-[13px] ms-1">{note}</span>}
      </div>
    </div>
  );
}

function SpecTable({ rows }: { rows: [string, string][] }) {
  return (
    <table className="w-full border-collapse text-[13px]">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <th className="w-[45%] border border-[#e3e6ea] bg-[#f7f8f9] px-3 py-2.5 font-semibold text-[#333] text-center">
              {k}
            </th>
            <td className="border border-[#e3e6ea] px-3 py-2.5 font-bold text-[#111]">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function NoteBox({ label, items }: { label: string; items: [string, string][] }) {
  return (
    <div className="mt-6">
      <span className="inline-block bg-[#3a3a3a] text-white text-[12px] rounded-full px-4 py-1.5">
        {label}
      </span>
      <div className="bg-[#f5f6f7] px-6 py-5 mt-[-14px] pt-8 space-y-4">
        {items.map(([t, d]) => (
          <div key={t} className="text-[12px] leading-relaxed">
            <div className="font-bold text-[#222] mb-1">▪ {t}</div>
            <p className="text-[#555] ps-3">{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AreaTag({ name, mark }: { name: string; mark?: Mark }) {
  const s = mark ? MARK_STYLE[mark] : null;
  return (
    <div className="mb-1.5">
      <span className="inline-block bg-[#eceff1] text-[#333] text-[11.5px] font-semibold px-1.5 py-0.5 leading-snug">
        {name}
      </span>
      {s && (
        <span
          className="inline-block text-[11px] font-semibold px-1.5 py-0.5 ms-1 leading-snug"
          style={{ backgroundColor: s.bg, color: s.color }}
        >
          {mark === "both" ? "◧" : mark === "paint" ? "●" : "◇"}
        </span>
      )}
    </div>
  );
}

/** Блок одного страхового случая: дата слева, два бокса справа. */
function ClaimRow({ c, d }: { c: Claim; d: ReportData }) {
  const detail = (
    <>
      {c.badge && (
        <div className="inline-block bg-[#3a3a3a] text-white text-[11px] rounded-full px-3 py-1 mb-1.5">
          {c.badge}
        </div>
      )}
      <div className="text-[12.5px] font-bold text-[#222] leading-relaxed">
        {d.repairCostLabel}
        <br />
        {c.total}
      </div>
      {c.breakdown && (
        <div className="text-[12px] font-bold text-[#222] mt-1 leading-relaxed">
          {c.breakdown.map(([k, v]) => (
            <div key={k}>
              - {k} : {v}
            </div>
          ))}
        </div>
      )}
      {c.historyBtn && (
        <span className="inline-block border border-[#bbb] rounded-full text-[10.5px] px-3 py-1 mt-2 text-[#444]">
          {c.historyBtn} ⌄
        </span>
      )}
    </>
  );

  return (
    <div className="flex flex-col sm:flex-row items-start gap-4 py-7 border-b border-dashed border-[#d8dce0] last:border-0">
      <div className="sm:w-[92px] shrink-0 text-[14px] text-[#222] sm:text-end pt-2">{c.date}</div>

      <div className="flex-1 grid md:grid-cols-[1.6fr_1fr] gap-3 w-full">
        {/* ДТП с участием моего автомобиля */}
        <div className="border border-[#e3e6ea]">
          <div className="bg-[#3a3a3a] text-white text-[12.5px] text-center py-2.5 px-2">
            {d.ownCrashTitle}
          </div>
          <div className="grid grid-cols-2">
            <div className="border-e border-[#e3e6ea]">
              <div className="bg-[#f7f8f9] text-[12px] text-center text-[#333] py-2.5 px-2 border-b border-[#e3e6ea] leading-snug">
                {d.ownInsurance}
              </div>
              <div className="px-3 py-4 text-center min-h-[74px]">
                {c.own && c.byOwnInsurance ? detail : null}
              </div>
            </div>
            <div>
              <div className="bg-[#f7f8f9] text-[12px] text-center text-[#333] py-2.5 px-2 border-b border-[#e3e6ea] leading-snug">
                {d.otherInsurance}
              </div>
              <div className="px-3 py-4 text-center min-h-[74px]">
                {c.own && !c.byOwnInsurance ? detail : null}
              </div>
            </div>
          </div>
        </div>

        {/* ДТП с участием автомобиля другой стороны */}
        <div className="border border-[#e3e6ea]">
          <div className="bg-[#8a8f94] text-white text-[12.5px] text-center py-2.5 px-2 leading-snug">
            {d.otherCrashTitle}
          </div>
          <div className="bg-[#f7f8f9] text-[12px] text-center font-semibold text-[#333] py-2.5 px-2 border-b border-[#e3e6ea]">
            {d.ownInsurance}
          </div>
          <div className="px-3 py-4 text-center min-h-[52px]">{!c.own ? detail : null}</div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────── сам отчёт ────────────────────────────── */

export function ReportExample({ lang }: { lang: GuideLocale }) {
  const d = DATA[lang];

  return (
    <div
      className="bg-white text-[#222] rounded-xl overflow-hidden shadow-2xl"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Плашка «это пример» — вне бланка отчёта */}
      <div className="bg-[#fff4e0] border-b border-[#f0d9ae] px-5 py-3 text-[12px] text-[#8a5a00] leading-relaxed">
        {d.disclaimer}
      </div>

      <div className="px-4 sm:px-7 py-8">
        {/* Заголовок бланка */}
        <div className="text-center mb-8">
          <div className="text-[19px] font-bold text-[#111]">{d.title}</div>
          <div className="text-[13px] font-semibold text-[#333] mt-1.5">
            {d.updatedLabel} : {d.updated}
          </div>
        </div>

        {/* 1. Общие сведения */}
        <SectionBar n={1} text={d.s1} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-6">
          {d.overview.map((o) => (
            <StatCard key={o.label} {...o} />
          ))}
        </div>
        <p className="text-center text-[14px] text-[#333] my-7">{d.overviewNote}</p>

        {/* 2. Подробные сведения */}
        <SectionBar n={2} text={d.s2} />
        <p className="text-[12px] text-[#666] mt-5 mb-3">{d.s2sub}</p>
        <div className="grid md:grid-cols-2 gap-x-5 gap-y-0">
          <SpecTable rows={d.specsLeft} />
          <SpecTable rows={d.specsRight} />
        </div>

        {/* 3. Специальное использование */}
        <div className="mt-9">
          <SectionBar n={3} text={d.s3} />
        </div>
        <p className="text-[12px] text-[#666] mt-5 mb-5">{d.s3sub}</p>
        <div className="grid grid-cols-3 gap-2.5">
          {d.special.map((s) => (
            <div key={s.label} className="text-center px-2">
              <Icon name={s.icon} />
              <div className="text-[13px] text-[#333] leading-snug mb-1">{s.label}</div>
              <div className="text-[17px] font-bold text-[#111]">{s.value}</div>
            </div>
          ))}
        </div>

        {/* 4. Смена номера / владельца */}
        <div className="mt-9">
          <SectionBar n={4} text={d.s4} />
        </div>
        <p className="text-[12px] text-[#666] mt-5 mb-3">{d.s4note}</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px] min-w-[540px]">
            <thead>
              <tr className="bg-[#f7f8f9]">
                {d.ownersCols.map((c) => (
                  <th
                    key={c}
                    className="border border-[#e3e6ea] px-3 py-2.5 font-normal text-[#333] text-center"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.owners.map((r) => (
                <tr key={r.date}>
                  <td className="border border-[#e3e6ea] px-3 py-2.5 text-center font-bold">
                    {r.date}
                  </td>
                  <td
                    className={`border border-[#e3e6ea] px-3 py-2.5 text-center font-bold ${
                      r.end ? "text-[#e02020]" : "text-[#111]"
                    }`}
                  >
                    {r.event}
                  </td>
                  <td className="border border-[#e3e6ea] px-3 py-2.5 text-center font-bold">
                    {r.plate}
                  </td>
                  <td className="border border-[#e3e6ea] px-3 py-2.5 text-center font-bold">
                    {r.purpose}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 5. Затопление / гибель / кража */}
        <div className="mt-9">
          <SectionBar n={5} text={d.s5} />
        </div>
        <p className="text-[12px] text-[#666] mt-5 mb-5">{d.s5sub}</p>
        <div className="grid grid-cols-3 gap-2.5">
          {d.loss.map((s) => (
            <div key={s.label} className="text-center px-2">
              <Icon name={s.icon} />
              <div className="text-[13px] text-[#333] leading-snug mb-1">{s.label}</div>
              <div className="text-[16px] font-bold text-[#111]">{s.value}</div>
            </div>
          ))}
        </div>
        <NoteBox label={d.noteLabel} items={d.s5notes} />

        {/* 6. История страховых случаев */}
        <div className="mt-9">
          <SectionBar n={6} text={d.s6} />
        </div>
        <p className="text-center text-[13px] text-[#333] mt-6 mb-4">{d.s6plateNote}</p>
        <div className="bg-[#f5f6f7] text-center text-[13px] text-[#333] py-3 px-4">
          {d.gapLabel}
        </div>
        {d.s6intro.map((p, i) => (
          <p key={i} className="text-[12px] text-[#555] leading-relaxed mt-4">
            {p}
          </p>
        ))}

        {/* Область ремонта и сводка */}
        <div className="border border-[#e3e6ea] mt-6">
          <div className="grid grid-cols-[2fr_1fr] bg-[#f7f8f9] border-b border-[#e3e6ea]">
            {d.diagramCols.map((c) => (
              <div key={c} className="text-center text-[12.5px] font-semibold text-[#333] py-3 px-2">
                {c}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[2fr_1fr] gap-4 p-4">
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                <div>
                  {d.areasLeft.map((a) => (
                    <AreaTag key={a.name} {...a} />
                  ))}
                </div>
                <div>
                  {d.areasRight.map((a) => (
                    <AreaTag key={a.name} {...a} />
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-3 border-t border-[#eceff1] text-[10.5px] text-[#555]">
                {(
                  [
                    ["paint", d.legend[0]],
                    ["remove", d.legend[1]],
                    ["both", d.legend[2]],
                  ] as [Mark, string][]
                ).map(([m, l]) => (
                  <span key={l} className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block w-4 h-3.5"
                      style={{ backgroundColor: MARK_STYLE[m].bg }}
                    />
                    {l}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-center self-start">
              {d.summary.map(([k, v]) => (
                <div key={k} className="text-[14px] text-[#333] mb-2">
                  {k} <span className="text-[#999]">···</span> {v}
                </div>
              ))}
              <span className="inline-block border border-[#bbb] rounded-full text-[10.5px] px-3 py-1 mt-2 text-[#444]">
                {d.allHistoryBtn}
              </span>
            </div>
          </div>
        </div>

        {/* Страховые случаи */}
        <div className="mt-2">
          {d.claims.map((c) => (
            <ClaimRow key={c.date} c={c} d={d} />
          ))}
        </div>

        <ul className="mt-6 space-y-2">
          {d.s6bullets.map((b, i) => (
            <li key={i} className="text-[12px] text-[#555] leading-relaxed flex gap-2">
              <span>-</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <NoteBox label={d.noteLabel} items={d.s6notes} />

        {/* 7. История пробега */}
        <div className="mt-9">
          <SectionBar n={7} text={d.s7} />
        </div>
        <div className="overflow-x-auto mt-6">
          <table className="w-full border-collapse text-[13px] min-w-[420px]">
            <thead>
              <tr className="bg-[#f7f8f9]">
                {d.mileageCols.map((c) => (
                  <th
                    key={c}
                    className="border border-[#e3e6ea] px-3 py-2.5 font-normal text-[#333] text-center"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.mileage.map((r) => (
                <tr key={r[0]}>
                  {r.map((cell, i) => (
                    <td
                      key={i}
                      className={`border border-[#e3e6ea] px-3 py-2.5 text-center ${
                        i === 1 ? "font-bold text-[#111]" : "text-[#333]"
                      }`}
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
    </div>
  );
}
