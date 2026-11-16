import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BranchesManagement } from "@/features/branches/components/branches-management";
import { isLocale } from "@/i18n/routing";

type BranchesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function BranchesPage({ params }: BranchesPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  return <BranchesManagement />;
}
