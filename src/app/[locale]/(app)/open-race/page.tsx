import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Open Race route deprecated for sales — managers use /manager lead queue (Model B). */
export default async function OpenRacePage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (role === "MANAGER" || role === "DIRECTOR") {
    redirect("/manager");
  }

  redirect("/portfolio");
}
