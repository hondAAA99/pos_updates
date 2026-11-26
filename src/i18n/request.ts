import { getRequestConfig } from "next-intl/server";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import { defaultLocale, intlFormats, isLocale } from "./routing";

const messages = { en, ar };

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;

  return {
    locale,
    formats: intlFormats,
    messages: messages[locale],
  };
});
