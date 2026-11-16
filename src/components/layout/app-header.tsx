"use client";

import {
  ChevronDown,
  CircleUserRound,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { getNavigationItem } from "@/config/navigation";
import { LanguageSwitcher } from "@/components/theme/language-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useRouter } from "@/i18n/navigation";
import { Breadcrumbs } from "./breadcrumbs";

type AppHeaderProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenMobileNavigation: () => void;
};

export function AppHeader({
  collapsed,
  onToggleCollapsed,
  onOpenMobileNavigation,
}: AppHeaderProps) {
  const app = useTranslations("application");
  const common = useTranslations("common");
  const navigation = useTranslations("navigation");
  const profile = useTranslations("profile");
  const employees = useTranslations("employees");
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const currentPage = getNavigationItem(pathname);
  const title = currentPage
    ? navigation(`items.${currentPage.id}.label`)
    : app("name");
  const profileName = user?.name ?? profile("name");
  const profileEmail = user?.email ?? profile("email");
  const profileRole = user
    ? employees(`roles.${user.role}`)
    : profile("role");

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-3 backdrop-blur sm:px-5 lg:px-7">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={app("openNavigation")}
          onClick={onOpenMobileNavigation}
          className="shrink-0 lg:hidden"
        >
          <Menu aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={app(collapsed ? "expandSidebar" : "collapseSidebar")}
          title={app(collapsed ? "expandSidebar" : "collapseSidebar")}
          onClick={onToggleCollapsed}
          className="hidden shrink-0 lg:inline-flex"
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden="true" className="rtl:scale-x-[-1]" />
          ) : (
            <PanelLeftClose aria-hidden="true" className="rtl:scale-x-[-1]" />
          )}
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground sm:text-base">
            {title}
          </p>
          <div className="mt-0.5 hidden min-w-0 sm:block">
            <Breadcrumbs />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <LanguageSwitcher
          label={common("language")}
          englishLabel={common("english")}
          arabicLabel={common("arabic")}
        />
        <ThemeToggle
          label={common("toggleTheme")}
          title={common("toggleThemeTitle")}
        />
        <details className="group/profile relative">
          <summary
            aria-label={profile("openMenu")}
            title={profile("openMenu")}
            className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg px-1.5 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden sm:px-2"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              <CircleUserRound aria-hidden="true" className="size-4" />
            </span>
            <span className="hidden min-w-0 text-start sm:block">
              <span className="block max-w-28 truncate text-xs font-medium text-foreground">
                {profileName}
              </span>
              <span className="block text-xs text-muted-foreground">
                {profileRole}
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className="hidden size-4 text-muted-foreground sm:block"
            />
          </summary>
          <div className="absolute end-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg">
            <div className="border-b border-border px-3 py-2.5">
              <p className="truncate text-sm font-semibold">{profileName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {profileEmail}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {profileRole}
              </p>
              {user?.branch && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {user.branch.name}
                </p>
              )}
            </div>
            <div className="pt-1">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-start text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"
              >
                <CircleUserRound aria-hidden="true" />
                {profile("profileAction")}
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-start text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"
              >
                <Settings aria-hidden="true" />
                {profile("settingsAction")}
              </button>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.replace("/login");
                }}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-start text-sm text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"
              >
                <LogOut aria-hidden="true" />
                {profile("signOutAction")}
              </button>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
