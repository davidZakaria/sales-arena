import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export function getRoleHomePath(role: string | undefined): string {
  switch (role) {
    case "OPERATIONS":
      return "/operations";
    case "FINANCE":
      return "/finance";
    default:
      return "/dashboard";
  }
}

/** Redirect Ops/Finance away from Sales-facing hub routes. */
export async function redirectIfSpecialistRole(role: string | undefined): Promise<void> {
  const home = getRoleHomePath(role);
  if (home !== "/dashboard") {
    const locale = await getLocale();
    redirect({ href: home, locale });
  }
}
