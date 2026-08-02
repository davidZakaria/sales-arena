"use client";

import { useTranslations } from "next-intl";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import type { SidebarBadges } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

type MobileNavProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badges?: SidebarBadges;
};

export function MobileNav({ open, onOpenChange, badges }: MobileNavProps) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-black/40 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 lg:hidden",
          )}
        />
        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-y-0 start-0 z-50 flex w-[min(100%,18rem)] flex-col bg-sidebar text-sidebar-foreground shadow-xl outline-none transition-transform duration-200 ease-out lg:hidden",
            "data-open:translate-x-0 data-closed:-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-sidebar-muted">
                {tCommon("companyName")}
              </p>
              <p className="mt-0.5 text-base font-semibold">{tCommon("appName")}</p>
            </div>
            <DialogPrimitive.Close
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent"
                  aria-label={t("closeMenu")}
                />
              }
            >
              <XIcon className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>
          <SidebarNav
            badges={badges}
            onNavigate={() => onOpenChange(false)}
            className="flex-1 overflow-y-auto p-4"
          />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
