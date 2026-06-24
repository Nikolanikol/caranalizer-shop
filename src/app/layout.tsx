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
    default: "Caranalizer | Korean Car Parts & VIN Check",
    template: "%s | Caranalizer",
  },
  description:
    "Genuine Korean car parts — 48,000+ Hyundai, Kia, Genesis OEM parts shipped worldwide. VIN verification for Korean vehicles.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://caranalizer.com"
  ),
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
        <Script id="clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","xc2ligwlp9");`}
        </Script>
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
