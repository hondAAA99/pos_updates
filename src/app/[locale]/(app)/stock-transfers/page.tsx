import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { TransfersManagement } from "@/features/transfers/components/transfers-management";
import { isLocale } from "@/i18n/routing";

type StockTransfersPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function StockTransfersPage({
  params,
}: StockTransfersPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  return <TransfersManagement />;
}
