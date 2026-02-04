import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { FloatingChatButton } from "@/components/chat";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <>
      <DashboardShell user={session.user}>
        {children}
      </DashboardShell>
      {/* Floating Ask HR Chat Button - placed outside DashboardShell for proper fixed positioning */}
      <FloatingChatButton href="/dashboard/chat" />
    </>
  );
}
