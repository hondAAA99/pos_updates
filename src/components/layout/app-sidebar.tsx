"use client";

import { ChevronDown, Store, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { navigationGroups } from "@/config/navigation";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { getRoleHomePath } from "@/features/auth/services/mock-auth-service";
import { canAccessRoute } from "@/features/auth/services/rbac";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  collapsed?: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
};

export function AppSidebar({
  collapsed = false,
  mobile = false,
  onNavigate,
}: AppSidebarProps) {
  const t = useTranslations("navigation");
  const app = useTranslations("application");
  const pathname = usePathname();
  const { user } = useAuth();
  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => user && canAccessRoute(user.role, item.href),
      ),
    }))
    .filter((group) => group.items.length > 0);
  const [expandedGroups, setExpandedGroups] = useState(
    () => new Set<string>(visibleGroups.map((group) => group.id)),
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-sidebar-border px-4",
          collapsed && !mobile ? "justify-center px-2" : "justify-between",
        )}
      >
        <Link
          href={user ? getRoleHomePath(user.role) : "/login"}
          onClick={onNavigate}
          aria-label={app("name")}
          className="flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Store aria-hidden="true" className="size-5" />
          </span>
          {(!collapsed || mobile) && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-sidebar-foreground">
                {app("name")}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {app("tagline")}
              </span>
            </span>
          )}
        </Link>
        {mobile && (
          <button
            type="button"
            data-mobile-close
            aria-label={app("closeNavigation")}
            onClick={onNavigate}
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        )}
      </div>

      <nav
        aria-label={t("primaryLabel")}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
      >
        <div className="space-y-5">
          {visibleGroups.map((group) => {
            const firstItem = group.items[0];
            const GroupIcon = firstItem.icon;
            const expanded = expandedGroups.has(group.id);

            return (
              <section key={group.id}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  title={collapsed && !mobile ? t(`groups.${group.id}`) : undefined}
                  onClick={() =>
                    setExpandedGroups((current) => {
                      const next = new Set(current);
                      if (next.has(group.id)) {
                        next.delete(group.id);
                      } else {
                        next.add(group.id);
                      }
                      return next;
                    })
                  }
                  className={cn(
                    "flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground outline-none transition-colors hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-ring",
                    collapsed && !mobile && "justify-center px-0",
                  )}
                  aria-label={t(`groups.${group.id}`)}
                >
                  <GroupIcon
                    aria-hidden="true"
                    className={cn(
                      "size-4 shrink-0",
                      !collapsed || mobile ? "hidden" : "block",
                    )}
                  />
                  {(!collapsed || mobile) && (
                    <span className="truncate">{t(`groups.${group.id}`)}</span>
                  )}
                  {(!collapsed || mobile) && (
                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        "ms-auto size-3.5 shrink-0 transition-transform",
                        !expanded && "-rotate-90 rtl:rotate-90",
                      )}
                    />
                  )}
                </button>
                {expanded && (
                  <ul className="mt-1 space-y-1">
                    {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    const label = t(`items.${item.id}.label`);

                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          aria-label={label}
                          aria-current={active ? "page" : undefined}
                          title={collapsed && !mobile ? label : undefined}
                          className={cn(
                            "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                            collapsed && !mobile && "justify-center px-0",
                            active
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                          )}
                        >
                          <Icon aria-hidden="true" className="size-[18px] shrink-0" />
                          {(!collapsed || mobile) && (
                            <span className="truncate">{label}</span>
                          )}
                        </Link>
                      </li>
                    );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </nav>

      {(!collapsed || mobile) && (
        <div className="shrink-0 border-t border-sidebar-border p-4">
          <p className="type-label">{app("workspaceLabel")}</p>
          <p className="mt-1 truncate text-sm font-medium text-sidebar-foreground">
            {app("workspaceName")}
          </p>
        </div>
      )}
    </div>
  );
}
