import { getRequestConfig } from "next-intl/server";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import { defaultLocale, isLocale } from "./routing";

const messages = { en, ar };

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;

  return {
    locale,
    messages: messages[locale],
  };
});
