import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ProductTypesManagement } from "@/features/product-types/components/product-types-management";
import { isLocale } from "@/i18n/routing";

type ProductTypesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProductTypesPage({
  params,
}: ProductTypesPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  return <ProductTypesManagement />;
}
