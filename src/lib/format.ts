import { localeSettings, type Locale } from "@/i18n/routing";

export function formatCurrency(amount: number, locale: Locale = "en"): string {
  const settings = localeSettings[locale];
  return new Intl.NumberFormat(settings.currencyLocale, {
    style: "currency",
    currency: "EGP",
    numberingSystem: "latn",
  }).format(amount);
}

export function formatNumber(
  value: number,
  locale: Locale = "en",
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(
    localeSettings[locale].currencyLocale,
    { ...options, numberingSystem: "latn" },
  ).format(value);
}

export function formatPercentage(value: number, locale: Locale = "en"): string {
  return formatNumber(value / 100, locale, {
    style: "percent",
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  });
}

export function formatDate(
  value: Date | string,
  locale: Locale = "en",
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(
    localeSettings[locale].formatLocale,
    { timeZone: "Africa/Cairo", ...options, numberingSystem: "latn" },
  ).format(typeof value === "string" ? new Date(value) : value);
}

export function formatDateKey(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  const year = part("year");
  const month = part("month");
  const day = part("day");

  if (!year || !month || !day) {
    throw new Error("Unable to format the date in the Africa/Cairo time zone.");
  }

  return `${year}-${month}-${day}`;
}
