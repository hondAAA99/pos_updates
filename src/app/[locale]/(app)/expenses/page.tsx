import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ExpensesManagement } from "@/features/expenses/components/expenses-management";
import { isLocale } from "@/i18n/routing";

type ExpensesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ExpensesPage({ params }: ExpensesPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  return <ExpensesManagement />;
}
