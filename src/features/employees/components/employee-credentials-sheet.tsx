"use client";

import { useLocale, useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { EmployeeCredentials } from "../types/employee";

type EmployeeCredentialsSheetProps = {
  credentials: EmployeeCredentials | null;
  onOpenChange: (open: boolean) => void;
};

export function EmployeeCredentialsSheet({
  credentials,
  onOpenChange,
}: EmployeeCredentialsSheetProps) {
  const t = useTranslations("employees");
  const locale = useLocale();

  return (
    <Sheet
      open={credentials !== null}
      onOpenChange={(open) => {
        if (!open) {
          onOpenChange(false);
        }
      }}
    >
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        showCloseButton={false}
        className="w-full gap-0 p-0 sm:max-w-lg"
      >
        {credentials && (
          <>
            <SheetHeader className="relative border-b border-border p-6 pe-14">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("actions.close")}
                title={t("actions.close")}
                onClick={() => {
                  onOpenChange(false);
                }}
                className="absolute end-3 top-3"
              >
                <X aria-hidden="true" />
              </Button>
              <SheetTitle>{t("credentials.title")}</SheetTitle>
              <SheetDescription>{t("credentials.description")}</SheetDescription>
            </SheetHeader>
            <dl className="grid gap-5 p-6">
              <Credential label={t("credentials.email")} value={credentials.email} />
              <Credential
                label={t("credentials.password")}
                value={credentials.password}
              />
              <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
                {t("credentials.oneTimeNotice")}
              </p>
            </dl>
            <SheetFooter className="flex-row justify-end border-t border-border p-6">
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                }}
              >
                {t("actions.close")}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Credential({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd dir="ltr" className="break-all rounded-md bg-muted/50 px-3 py-2 font-mono text-sm">
        {value}
      </dd>
    </div>
  );
}
