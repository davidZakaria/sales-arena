import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Inquiries are shown on My Work (/portfolio) for sales. */
export default async function InquiriesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "SALES") {
    redirect("/portfolio");
  }

  redirect("/dashboard");
}
