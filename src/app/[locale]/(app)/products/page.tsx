import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ProductsManagement } from "@/features/products/components/products-management";
import { isLocale } from "@/i18n/routing";

type ProductsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  return <ProductsManagement />;
}
