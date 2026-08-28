import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        hostname: "dyadajdrxnvzkrmuoaku.supabase.co",
        pathname: "/**",
      },
      // Фотографии запчастей лежат на CDN донора. Сейчас в разделе везде обычный <img>,
      // но при переходе на next/image домен должен быть здесь.
      {
        protocol: "https",
        hostname: "ecimg.cafe24img.com",
        pathname: "/**",
      },
      // Фотографии дисков лежат у второго донора (skywheel.kr) и тоже хотлинкаются:
      // проверены все 420, отдаются с чужим Referer.
      {
        protocol: "https",
        hostname: "www.skywheel.kr",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
