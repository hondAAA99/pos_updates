import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { SalesManagement } from "@/features/sales/components/sales-management";
import { isLocale } from "@/i18n/routing";

type SalesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SalesPage({ params }: SalesPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  return <SalesManagement locale={locale} />;
}
