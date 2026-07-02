import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Caranalizer | Korean Auto Parts — Hyundai, Kia, Genesis OEM Parts from Korea",
    template: "%s",
  },
  description:
    "Buy 140,000+ genuine Hyundai, Kia, Genesis OEM parts direct from Korea. Korean auto parts & Mobis parts shipped worldwide.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://caranalizer.com"
  ),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  verification: {
    google: "xyGySZjOk_Gt-JrVaVUX6TlL_w5nw-WPd9_yDA3c8GU",
    yandex: "1f004d7949535b31",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning className={spaceGrotesk.variable}>
      <body>
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-7MZ9ET3VPK"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-7MZ9ET3VPK');`}
        </Script>
        <Script id="clarity-init" strategy="beforeInteractive">
          {`window.clarity=window.clarity||function(){(window.clarity.q=window.clarity.q||[]).push(arguments)};`}
        </Script>
        <Script
          src="https://www.clarity.ms/tag/xc2ligwlp9"
          strategy="afterInteractive"
        />
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=108825981','ym');ym(108825981,'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true,ecommerce:"dataLayer"});`}
        </Script>
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/108825981" style={{position:'absolute',left:'-9999px'}} alt="" />
          </div>
        </noscript>
      </body>
    </html>
  );
}
