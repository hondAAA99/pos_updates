import { defineRouting } from "next-intl/routing";

export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: false,
});

export const localeSettings: Record<
  Locale,
  { direction: "ltr" | "rtl"; currencyLocale: string; formatLocale: string }
> = {
  en: {
    direction: "ltr",
    currencyLocale: "en-EG",
    formatLocale: "en-EG-u-nu-latn",
  },
  ar: {
    direction: "rtl",
    currencyLocale: "ar-EG",
    formatLocale: "ar-EG-u-nu-latn",
  },
};

export const intlFormats = {
  number: {
    western: {
      numberingSystem: "latn",
    },
  },
};

export function isLocale(locale: string | undefined): locale is Locale {
  return locales.some((supportedLocale) => supportedLocale === locale);
};
