import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
import {
  getNavigationItem,
  navigationItems,
} from "@/config/navigation";
import { isLocale, type Locale } from "@/i18n/routing";

type PlaceholderPageProps = {
  params: Promise<{ locale: string; slug: string[] }>;
};

export function generateStaticParams() {
  return navigationItems
    .filter(
      (item) =>
        item.href !== "/dashboard" &&
        item.href !== "/product-types" &&
        item.href !== "/products" &&
        item.href !== "/inventory" &&
        item.href !== "/branch-inventory" &&
        item.href !== "/stock-history" &&
        item.href !== "/stock-transfers" &&
        item.href !== "/branches" &&
        item.href !== "/suppliers" &&
        item.href !== "/supplier-deposits" &&
        item.href !== "/supplier-transactions" &&
        item.href !== "/employees" &&
        item.href !== "/sales" &&
        item.href !== "/wallets" &&
        item.href !== "/expenses" &&
        item.href !== "/cashier/dashboard",
    )
    .map((item) => ({
      slug: item.href.slice(1).split("/"),
    }));
}

export default async function PlaceholderPage({
  params,
}: PlaceholderPageProps) {
  const { locale: routeLocale, slug } = await params;

  if (!isLocale(routeLocale)) {
    notFound();
  }

  const locale: Locale = routeLocale;
  const item = getNavigationItem(`/${slug.join("/")}`);

  if (!item) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations("navigation");

  return (
    <PagePlaceholder
      title={t(`items.${item.id}.label`)}
      description={t(`items.${item.id}.description`)}
      statusLabel={t("placeholder.title")}
      statusDescription={t("placeholder.description")}
    />
  );
}
