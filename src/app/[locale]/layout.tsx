import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { routing, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import "../globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "BRM | Broker Relationship Management",
  description: "Broker Relationship Management for New Jersey Developments",
  icons: {
    icon: "/favicon.svg",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as AppLocale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={cn(
          locale === "ar" ? ibmPlexSansArabic.variable : ibmPlexSans.variable,
          "min-h-screen font-sans antialiased",
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthSessionProvider>
            <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
