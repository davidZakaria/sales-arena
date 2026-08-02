"use client";

import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function PublicPageControls() {
  return (
    <div className="absolute end-4 top-4 flex items-center gap-2">
      <ThemeToggle />
      <LocaleSwitcher />
    </div>
  );
}
