"use client";

import { useLocale, useTranslations } from "next-intl";
import { getPathname, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("common");

  function switchLocale(nextLocale: "en" | "ar") {
    if (nextLocale === locale) return;
    // Full navigation avoids React DOM errors when lang/dir/fonts on <html> change
    // (soft router.replace + refresh conflicts with theme/dialog portals).
    const href = getPathname({ href: pathname, locale: nextLocale });
    window.location.assign(href);
  }

  return (
    <div
      className="inline-flex rounded-lg border border-border bg-muted p-0.5"
      role="group"
      aria-label={t("language")}
    >
      <button
        type="button"
        onClick={() => switchLocale("en")}
        className={cn(
          "min-h-11 rounded-md px-3 py-2 text-xs font-medium transition-colors sm:min-h-0 sm:px-2.5 sm:py-1",
          locale === "en"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchLocale("ar")}
        className={cn(
          "min-h-11 rounded-md px-3 py-2 text-xs font-medium transition-colors sm:min-h-0 sm:px-2.5 sm:py-1",
          locale === "ar"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={locale === "ar"}
      >
        ع
      </button>
    </div>
  );
}
