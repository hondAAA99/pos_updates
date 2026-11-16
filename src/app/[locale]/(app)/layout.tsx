import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AuthRouteGuard } from "@/features/auth/components/auth-route-guard";

export default function ApplicationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthRouteGuard>
      <AppShell>{children}</AppShell>
    </AuthRouteGuard>
  );
}
