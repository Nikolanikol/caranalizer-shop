#!/usr/bin/env bash
# SEO-автоматика caranalizer: один прогон полного цикла.
#   collect   GSC → ca_seo_page_stats
#   generate  кандидаты → Gemini → ca_seo_suggestions  (батч GENERATE_LIMIT)
#   publish   draft → ca_parts_seo + revalidate
#
# Вся работа идёт в Next-процессе на проде, скрипт — это три curl (нагрузки нет).
# Шаги не аварят друг друга: если generate упрётся в квоту, publish всё равно
# выложит то, что уже сгенерилось.
#
# Переопределяемые переменные окружения:
#   SEO_BASE        (по умолчанию https://caranalizer.com)
#   ENV_FILE        (по умолчанию /var/www/caranalizer/.env — поправь под сервер)
#   GENERATE_LIMIT  (по умолчанию 30 карточек за прогон — волновая раскатка)
#   SEO_CRON_SECRET (иначе берётся из ENV_FILE)

set -uo pipefail

SEO_BASE="${SEO_BASE:-https://caranalizer.com}"
ENV_FILE="${ENV_FILE:-/var/www/caranalizer/.env}"
GENERATE_LIMIT="${GENERATE_LIMIT:-30}"

if [[ -z "${SEO_CRON_SECRET:-}" && -f "$ENV_FILE" ]]; then
  SEO_CRON_SECRET="$(grep -m1 '^SEO_CRON_SECRET=' "$ENV_FILE" | cut -d= -f2- | tr -d '"'"'"'')"
fi
if [[ -z "${SEO_CRON_SECRET:-}" ]]; then
  echo "[$(date -Is)] ERROR: SEO_CRON_SECRET не найден (ни в env, ни в $ENV_FILE)" >&2
  exit 1
fi

run_step() {
  local name="$1" url="$2"
  echo "[$(date -Is)] POST $url"
  local code
  code=$(curl -sS -o /tmp/seo-${name}-resp.json -w '%{http_code}' \
    --max-time 300 -X POST -H "x-seo-secret: ${SEO_CRON_SECRET}" "$url") || true
  echo "[$(date -Is)] ${name}: HTTP ${code}  $(cat /tmp/seo-${name}-resp.json 2>/dev/null)"
}

run_step collect  "${SEO_BASE}/api/seo/collect"
run_step generate "${SEO_BASE}/api/seo/generate?limit=${GENERATE_LIMIT}"
run_step publish  "${SEO_BASE}/api/seo/publish"

echo "[$(date -Is)] done"
