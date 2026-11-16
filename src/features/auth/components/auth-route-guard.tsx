"use client";

import { useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { useAuth } from "../providers/auth-provider";
import { canAccessRoute } from "../services/rbac";

export function AuthRouteGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("auth");

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canAccessRoute(user.role, pathname)) {
      router.replace("/access-denied");
    }
  }, [isLoading, pathname, router, user]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="px-8 py-6">
          <p role="status" className="text-sm text-muted-foreground">
            {t("states.checkingSession")}
          </p>
        </Card>
      </div>
    );
  }

  if (!canAccessRoute(user.role, pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="px-8 py-6">
          <p role="status" className="text-sm text-muted-foreground">
            {t("states.checkingSession")}
          </p>
        </Card>
      </div>
    );
  }

  return children;
}
