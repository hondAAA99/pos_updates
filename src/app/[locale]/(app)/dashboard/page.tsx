import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { SalesManagement } from "@/features/sales/components/sales-management";
import { isLocale, type Locale } from "@/i18n/routing";

type DashboardPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale: routeLocale } = await params;

  if (!isLocale(routeLocale)) {
    notFound();
  }

  const locale: Locale = routeLocale;
  setRequestLocale(locale);

  return <SalesManagement locale={locale} />;
}
