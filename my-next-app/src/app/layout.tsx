import type { Metadata } from "next";
import Script from "next/script";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Al-Madinah Tour & Travel - Umroh & Haji Khusus",
  description:
    "Pelayanan perjalanan ibadah Umroh dan Haji Khusus bertaraf bintang 5 dengan bimbingan muthawif berkompeten, hotel dekat Masjidil Haram, dan kepastian jadwal keberangkatan.",
  keywords: [
    "Al-Madinah Tour",
    "Umroh",
    "Haji Khusus",
    "Paket Umroh 1448H",
    "PPIU Kemenag",
    "Baitullah",
  ],
  openGraph: {
    title: "Al-Madinah Tour & Travel - Umroh & Haji Khusus",
    description:
      "Pelayanan perjalanan ibadah Umroh dan Haji Khusus bertaraf bintang 5 dengan bimbingan muthawif berkompeten, hotel dekat Masjidil Haram, dan kepastian jadwal keberangkatan.",
    url: "https://almadinahtour.com",
    siteName: "Al-Madinah Tour & Travel",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Al-Madinah Tour & Travel - Umroh & Haji Khusus",
    description:
      "Pelayanan perjalanan ibadah Umroh dan Haji Khusus bertaraf bintang 5 dengan bimbingan muthawif berkompeten, hotel dekat Masjidil Haram, dan kepastian jadwal keberangkatan.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="font-sans antialiased min-h-screen bg-[#f8faf9] text-slate-800">
        <QueryProvider>{children}</QueryProvider>
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""}
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
