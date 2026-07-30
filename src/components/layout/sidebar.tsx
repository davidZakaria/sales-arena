"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Briefcase,
  ClipboardCheck,
  LayoutDashboard,
  Scale,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SidebarBadges = {
  auditQueue?: number;
  pendingAssignments?: number;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

export function Sidebar({ badges = {} }: { badges?: SidebarBadges }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  let navItems: NavItem[];

  if (role === "OPERATIONS") {
    navItems = [
      {
        href: "/operations",
        label: "Operations Hub",
        icon: ClipboardCheck,
        badge: badges.auditQueue,
      },
    ];
  } else {
    navItems = [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/portfolio", label: "My Portfolio", icon: Briefcase },
      { href: "/open-race", label: "Open Race Market", icon: Trophy },
    ];

    if (role === "MANAGER" || role === "DIRECTOR") {
      navItems.push({
        href: "/manager",
        label: "Manager Dashboard",
        icon: Scale,
        badge: badges.pendingAssignments,
      });
    }
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
          New Jersey Developments
        </p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight">BRM</h1>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge !== undefined && badge > 0 && (
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-slate-950">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
