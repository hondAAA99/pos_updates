"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import {
  defaultLocale,
  isLocale,
  localeSettings,
  routing,
  type Locale,
} from "@/i18n/routing";

type LanguageSwitcherProps = {
  label: string;
  englishLabel: string;
  arabicLabel: string;
};

export function LanguageSwitcher({
  label,
  englishLabel,
  arabicLabel,
}: LanguageSwitcherProps) {
  const currentLocale = useLocale();
  const locale = isLocale(currentLocale) ? currentLocale : defaultLocale;
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = localeSettings[locale].direction;
  }, [locale]);

  function changeLocale(nextLocaleValue: string) {
    if (!isLocale(nextLocaleValue)) {
      return;
    }

    const nextLocale: Locale = nextLocaleValue;
    const search = window.location.search;
    const hash = window.location.hash;

    router.replace(`${pathname}${search}${hash}`, { locale: nextLocale });
  }

  return (
    <div className="inline-flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm shadow-xs">
      <Languages aria-hidden="true" className="size-4 text-muted-foreground" />
      <label htmlFor="language-switcher" className="sr-only">
        {label}
      </label>
      <select
        id="language-switcher"
        aria-label={label}
        className="h-full cursor-pointer bg-transparent text-foreground outline-none"
        value={locale}
        onChange={(event) => changeLocale(event.currentTarget.value)}
      >
        {routing.locales.map((supportedLocale) => (
          <option key={supportedLocale} value={supportedLocale}>
            {supportedLocale === "en" ? englishLabel : arabicLabel}
          </option>
        ))}
      </select>
    </div>
  );
}
