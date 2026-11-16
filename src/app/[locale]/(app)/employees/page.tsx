import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { EmployeesManagement } from "@/features/employees/components/employees-management";
import { isLocale } from "@/i18n/routing";

type EmployeesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function EmployeesPage({ params }: EmployeesPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  return <EmployeesManagement />;
}
