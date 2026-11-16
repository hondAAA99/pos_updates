"use client";

import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { getRoleHomePath } from "@/features/auth/services/mock-auth-service";

export default function AccessDeniedPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-10">
      <Card className="w-full max-w-xl p-8 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert aria-hidden="true" className="size-8" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">{t("accessDenied.title")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("accessDenied.description")}
        </p>
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            onClick={() => router.replace(user ? getRoleHomePath(user.role) : "/login")}
          >
            {t("accessDenied.backToDashboard")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
