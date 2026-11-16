import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BranchInventoryManagement } from "@/features/branches/components/branch-inventory-management";
import { isLocale } from "@/i18n/routing";

type BranchInventoryPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function BranchInventoryPage({
  params,
}: BranchInventoryPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  return <BranchInventoryManagement />;
}
