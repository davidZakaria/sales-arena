"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Briefcase, LayoutDashboard, Scale, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const baseNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portfolio", label: "My Portfolio", icon: Briefcase },
  { href: "/open-race", label: "Open Race Market", icon: Trophy },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems =
    session?.user?.role === "MANAGER" || session?.user?.role === "DIRECTOR"
      ? [
          ...baseNavItems,
          { href: "/manager", label: "Manager Dashboard", icon: Scale },
        ]
      : baseNavItems;

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
          New Jersey Developments
        </p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight">BRM</h1>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => {
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
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
