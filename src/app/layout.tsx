import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning className={spaceGrotesk.variable}>
      <body>{children}</body>
    </html>
  );
}
