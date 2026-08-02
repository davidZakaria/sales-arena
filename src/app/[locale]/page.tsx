import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { authOptions } from "@/lib/auth";
import { getRoleHomePath } from "@/lib/navigation/role-home";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  if (!session?.user) {
    redirect({ href: "/login", locale });
    return;
  }

  redirect({ href: getRoleHomePath(session.user.role), locale });
}
