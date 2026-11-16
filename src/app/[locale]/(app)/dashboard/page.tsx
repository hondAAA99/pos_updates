import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { AdminDashboard } from "@/features/dashboard/components/admin-dashboard";
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

  return <AdminDashboard locale={locale} />;
}
