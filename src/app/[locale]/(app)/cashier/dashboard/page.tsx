import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { CashierDashboard } from "@/features/dashboard/components/cashier-dashboard";
import { isLocale, type Locale } from "@/i18n/routing";

type CashierDashboardPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CashierDashboardPage({
  params,
}: CashierDashboardPageProps) {
  const { locale: routeLocale } = await params;

  if (!isLocale(routeLocale)) {
    notFound();
  }

  const locale: Locale = routeLocale;
  setRequestLocale(locale);

  return <CashierDashboard locale={locale} />;
}
