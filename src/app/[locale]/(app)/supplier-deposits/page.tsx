import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { SupplierFinancialRecordsManagement } from "@/features/suppliers/components/supplier-financial-records-management";
import { isLocale } from "@/i18n/routing";

type SupplierDepositsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SupplierDepositsPage({
  params,
}: SupplierDepositsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);
  return <SupplierFinancialRecordsManagement kind="deposits" />;
}
