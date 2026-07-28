import { AppShell } from "@/components/layout/app-shell";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { revertExpiredClaims } from "@/lib/claims/revert-expired-claims";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await revertExpiredClaims();
  } catch (error) {
    console.error("[revertExpiredClaims]", error);
  }

  return (
    <AuthSessionProvider>
      <AppShell>{children}</AppShell>
    </AuthSessionProvider>
  );
}
