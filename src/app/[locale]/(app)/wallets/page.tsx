import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { WalletsManagement } from "@/features/wallets/components/wallets-management";
import { isLocale } from "@/i18n/routing";

type WalletsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function WalletsPage({ params }: WalletsPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  return <WalletsManagement />;
}
