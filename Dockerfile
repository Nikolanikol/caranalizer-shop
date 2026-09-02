FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts --legacy-peer-deps

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL=https://caranalizer.com
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Кэш Next между сборками. Без него Turbopack компилирует с нуля каждый деплой,
# а Data Cache пуст — значит все обращения к Supabase идут по сети заново.
#
# `id` обязателен и не для красоты: на этом же VPS собирается kmotors, а маунты
# без явного id делятся по пути назначения. Совпади путь — две сборки полезли бы
# в один кэш.
#
# В образ этот каталог не попадает: маунт живёт только на время `RUN`, а наружу
# уезжает `.next/standalone` и `.next/static`, которых он не касается.
RUN --mount=type=cache,id=caranalizer-next-cache,target=/app/.next/cache npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public

# `--chown` тут ОБЯЗАТЕЛЕН, и снимать его нельзя — проверено 02.09.2026 запуском
# собранного образа. Кажется, что каталог нужен только на чтение, но Next пишет кэш ISR
# **в `.next/server/app`**, а не только в `.next/cache`: без прав контейнер отвечает
#
#   Failed to update prerender cache … EACCES: permission denied,
#   mkdir '/app/.next/server/app/ru/zapchasti/…'
#
# Страница при этом отдаётся, просто не кэшируется — то есть каждый заход остаётся
# холодным, и на проде это видно только по медленным ответам. Сборка молчит.
#
# Цена смены владельца прямо пропорциональна числу собранных страниц: на 5 834 карточках
# это было 55 секунд, на 1 142 — секунды. Рычаг тут `PRERENDER_MIN_OFFERS`, а не `--chown`.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
