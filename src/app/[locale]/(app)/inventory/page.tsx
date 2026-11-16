import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { InventoryManagement } from "@/features/inventory/components/inventory-management";
import { isLocale } from "@/i18n/routing";

type InventoryPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function InventoryPage({ params }: InventoryPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  return <InventoryManagement />;
}
