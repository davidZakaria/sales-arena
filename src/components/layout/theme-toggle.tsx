"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("theme");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11 shrink-0 relative"
        aria-label={t("toggle")}
        disabled
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-11 w-11 shrink-0 relative"
      aria-label={isDark ? t("switchToLight") : t("switchToDark")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Sun
        className={cn(
          "h-4 w-4 transition-all",
          isDark ? "scale-0 opacity-0" : "scale-100 opacity-100",
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-all",
          isDark ? "scale-100 opacity-100" : "scale-0 opacity-0",
        )}
      />
    </Button>
  );
}
