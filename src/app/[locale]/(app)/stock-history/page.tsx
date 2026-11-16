import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { StockHistoryManagement } from "@/features/inventory/components/stock-history-management";
import { isLocale } from "@/i18n/routing";

type StockHistoryPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function StockHistoryPage({
  params,
}: StockHistoryPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  return <StockHistoryManagement />;
}
