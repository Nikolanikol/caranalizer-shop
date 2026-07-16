// Google Search Console API — чтение performance-данных.
//
// Авторизация через service account (JWT), без тяжёлого пакета googleapis:
// берём access token из google-auth-library и ходим в REST-эндпоинт напрямую.
//
// ENV:
//   GSC_SA_JSON   — весь JSON ключа service account одной строкой
//   GSC_SITE_URL  — ресурс в Search Console:
//                     domain property   → "sc-domain:caranalizer.com"
//                     URL-prefix property → "https://caranalizer.com/"
//
// Service account нужно добавить как пользователя ресурса в GSC
// (Настройки → Пользователи и разрешения → e-mail из client_email ключа).

import { JWT } from "google-auth-library";

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const ROW_LIMIT = 25_000; // максимум GSC на один запрос

export type GscRow = {
  /** URL страницы (dimension "page") */
  page: string;
  clicks: number;
  impressions: number;
  ctr: number; // 0..1
  position: number;
};

let cachedClient: JWT | null = null;

function getClient(): JWT {
  if (cachedClient) return cachedClient;

  const raw = process.env.GSC_SA_JSON;
  if (!raw) throw new Error("GSC_SA_JSON не задан в окружении");

  let creds: { client_email: string; private_key: string };
  try {
    creds = JSON.parse(raw);
  } catch {
    throw new Error("GSC_SA_JSON не является валидным JSON");
  }

  cachedClient = new JWT({
    email: creds.client_email,
    // приватный ключ часто хранят с экранированными \n — разэкранируем
    key: creds.private_key.replace(/\\n/g, "\n"),
    scopes: [SCOPE],
  });
  return cachedClient;
}

function siteUrl(): string {
  const s = process.env.GSC_SITE_URL;
  if (!s) throw new Error("GSC_SITE_URL не задан в окружении");
  return s;
}

/** YYYY-MM-DD со сдвигом на N дней от сегодня (UTC). */
export function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * Тянет performance-данные с разрезом по странице за окно [startDate, endDate].
 * Постранично, пока GSC отдаёт полные страницы (ROW_LIMIT строк).
 */
export async function fetchPageStats(
  startDate: string,
  endDate: string
): Promise<GscRow[]> {
  const client = getClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("Не удалось получить access token GSC");

  const endpoint =
    `https://www.googleapis.com/webmasters/v3/sites/` +
    `${encodeURIComponent(siteUrl())}/searchAnalytics/query`;

  const out: GscRow[] = [];

  for (let startRow = 0; ; startRow += ROW_LIMIT) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ["page"],
        rowLimit: ROW_LIMIT,
        startRow,
        dataState: "final",
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`GSC API ${res.status}: ${detail.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
    };
    const rows = json.rows ?? [];

    for (const r of rows) {
      out.push({
        page: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      });
    }

    if (rows.length < ROW_LIMIT) break; // последняя страница
  }

  return out;
}
