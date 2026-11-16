import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { LoginPage } from "@/features/auth/components/login-page";
import { isLocale } from "@/i18n/routing";

type LoginRouteProps = {
  params: Promise<{ locale: string }>;
};

export default async function LoginRoute({ params }: LoginRouteProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  return <LoginPage />;
}
