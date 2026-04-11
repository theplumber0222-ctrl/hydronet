import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { JsonLd } from "@/components/JsonLd";
import { Providers } from "@/components/Providers";
import { getDictionary, getLocale } from "@/i18n/server";
import { t } from "@/i18n/t";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const d = getDictionary(await getLocale());
  return {
    title: t(d, "meta.siteTitle"),
    description: t(d, "meta.siteDescription"),
    openGraph: {
      title: t(d, "meta.siteTitle"),
      description: t(d, "meta.siteDescription"),
      url: "https://hydronet.live",
      siteName: "HydroNet Plumbing",
      locale: "en_US",
      type: "website",
      images: [{ url: "/branding/hydronet-logo-final.png" }],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = getDictionary(locale);

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <JsonLd messages={messages} />
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
