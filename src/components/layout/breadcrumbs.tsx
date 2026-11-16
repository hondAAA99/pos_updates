"use client";

import { ChevronRight, House } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  getNavigationItem,
  type NavigationItem,
} from "@/config/navigation";

type BreadcrumbItem = {
  item: NavigationItem;
  href: string;
};

function getBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  for (let index = 0; index < segments.length; index += 1) {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const item = getNavigationItem(href);

    if (item && href !== "/dashboard") {
      breadcrumbs.push({ item, href });
    }
  }

  return breadcrumbs;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const dashboard = getNavigationItem("/dashboard");
  const breadcrumbs = getBreadcrumbItems(pathname);
  const isDashboard = pathname === "/dashboard";

  return (
    <nav aria-label={t("breadcrumbLabel")} className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {dashboard && (
          <li className="flex min-w-0 items-center gap-1.5">
            {isDashboard ? (
              <span
                aria-current="page"
                className="inline-flex min-w-0 items-center gap-2 font-medium text-foreground"
              >
                <House aria-hidden="true" className="size-4 shrink-0" />
                <span className="truncate">
                  {t(`items.${dashboard.id}.label`)}
                </span>
              </span>
            ) : (
              <Link
                href="/dashboard"
                className="inline-flex min-w-0 items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <House aria-hidden="true" className="size-4 shrink-0" />
                <span className="truncate">
                  {t(`items.${dashboard.id}.label`)}
                </span>
              </Link>
            )}
          </li>
        )}
        {breadcrumbs.map(({ item, href }, index) => {
          const current = index === breadcrumbs.length - 1;

          return (
            <li
              key={href}
              className="flex min-w-0 items-center gap-1.5"
              aria-current={current ? "page" : undefined}
            >
              <ChevronRight
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground rtl:rotate-180"
              />
              {current ? (
                <span className="truncate font-medium text-foreground">
                  {t(`items.${item.id}.label`)}
                </span>
              ) : (
                <Link
                  href={href}
                  className="truncate text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t(`items.${item.id}.label`)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
