"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import {
  Briefcase,
  ClipboardCheck,
  Coins,
  LayoutDashboard,
  Package,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SidebarBadges } from "@/components/layout/sidebar";

type NavItem = {
  href:
    | "/dashboard"
    | "/portfolio"
    | "/manager"
    | "/operations"
    | "/finance"
    | "/inventory";
  labelKey:
    | "dashboard"
    | "portfolio"
    | "managerDashboard"
    | "operationsHub"
    | "financeHub"
    | "inventoryLibrary";
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

type SidebarNavProps = {
  badges?: SidebarBadges;
  onNavigate?: () => void;
  className?: string;
};

export function SidebarNav({ badges = {}, onNavigate, className }: SidebarNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const t = useTranslations("nav");

  let navItems: NavItem[];

  if (role === "OPERATIONS") {
    navItems = [
      {
        href: "/operations",
        labelKey: "operationsHub",
        icon: ClipboardCheck,
        badge: (badges.auditQueue ?? 0) + (badges.draftCount ?? 0) || undefined,
      },
    ];
  } else if (role === "FINANCE") {
    navItems = [
      {
        href: "/finance",
        labelKey: "financeHub",
        icon: Coins,
        badge: badges.pendingEois,
      },
    ];
  } else {
    navItems = [
      { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
      { href: "/portfolio", labelKey: "portfolio", icon: Briefcase },
    ];

    if (role === "SALES") {
      navItems.push(
        {
          href: "/portfolio",
          labelKey: "portfolio",
          icon: Briefcase,
          badge: badges.assignedInquiryCount,
        },
        {
          href: "/inventory",
          labelKey: "inventoryLibrary",
          icon: Package,
        },
      );
    }

    if (role === "MANAGER" || role === "DIRECTOR") {
      navItems.push(
        {
          href: "/manager",
          labelKey: "managerDashboard",
          icon: Scale,
          badge: (badges.unassignedLeadCount ?? 0) + (badges.newInquiryCount ?? 0) || undefined,
        },
        {
          href: "/inventory",
          labelKey: "inventoryLibrary",
          icon: Package,
        },
      );
    }
  }

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {navItems.map(({ href, labelKey, icon: Icon, badge }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-80" />
            <span className="flex-1">{t(labelKey)}</span>
            {badge !== undefined && badge > 0 && (
              <span className="rounded-full bg-sidebar-primary px-2 py-0.5 text-xs font-semibold text-sidebar-primary-foreground">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
