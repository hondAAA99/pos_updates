import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { SuppliersManagement } from "@/features/suppliers/components/suppliers-management";
import { isLocale } from "@/i18n/routing";

type SuppliersPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SuppliersPage({ params }: SuppliersPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  return <SuppliersManagement />;
}
