import { ArrowUpRight, Check, CircleAlert, CircleCheck, Info } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { LanguageSwitcher } from "@/components/theme/language-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { formatCurrency } from "@/lib/format";
import { isLocale, type Locale } from "@/i18n/routing";

type DesignSystemPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function DesignSystemPage({
  params,
}: DesignSystemPageProps) {
  const { locale: routeLocale } = await params;

  if (!isLocale(routeLocale)) {
    notFound();
  }

  const locale: Locale = routeLocale;
  setRequestLocale(locale);
  const t = await getTranslations("designSystem");
  const common = await getTranslations("common");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <header className="flex items-start justify-between gap-6">
        <div className="max-w-2xl space-y-3">
          <p className="type-label text-primary">{t("eyebrow")}</p>
          <h1 className="type-page-title">{t("title")}</h1>
          <p className="type-secondary max-w-xl">{t("intro")}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <LanguageSwitcher
            label={common("language")}
            englishLabel={common("english")}
            arabicLabel={common("arabic")}
          />
          <ThemeToggle
            label={common("toggleTheme")}
            title={common("toggleThemeTitle")}
          />
        </div>
      </header>

      <Separator />

      <section aria-labelledby="typography-heading" className="space-y-5">
        <div>
          <h2 id="typography-heading" className="type-section-title">
            {t("typography.title")}
          </h2>
          <p className="type-secondary mt-1">
            {t("typography.description")}
          </p>
        </div>
        <Card className="gap-5">
          <div>
            <p className="type-label mb-2">{t("typography.pageTitleLabel")}</p>
            <p className="type-page-title">
              {t("typography.pageTitleExample")}
            </p>
          </div>
          <Separator />
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="type-label mb-2">
                {t("typography.sectionHeadingLabel")}
              </p>
              <p className="type-section-title">
                {t("typography.sectionHeadingExample")}
              </p>
            </div>
            <div>
              <p className="type-label mb-2">{t("typography.cardTitleLabel")}</p>
              <p className="type-card-title">
                {t("typography.cardTitleExample")}
              </p>
            </div>
            <div>
              <p className="type-label mb-2">{t("typography.bodyLabel")}</p>
              <p className="type-body">{t("typography.bodyExample")}</p>
            </div>
            <div>
              <p className="type-label mb-2">
                {t("typography.secondaryLabel")}
              </p>
              <p className="type-secondary">
                {t("typography.secondaryExample")}
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex flex-wrap items-end gap-8">
            <div>
              <p className="type-label mb-2">{t("typography.smallLabel")}</p>
              <span className="type-label">
                {t("typography.smallLabelExample")}
              </span>
            </div>
            <div>
              <p className="type-label mb-2">{t("typography.numericLabel")}</p>
              <span className="type-numeric text-3xl">
                {t("typography.numericExample")}
              </span>
            </div>
          </div>
        </Card>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="buttons-heading" className="space-y-5">
          <div>
            <h2 id="buttons-heading" className="type-section-title">
              {t("buttons.title")}
            </h2>
            <p className="type-secondary mt-1">{t("buttons.description")}</p>
          </div>
          <Card className="gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <Button>{t("buttons.primary")}</Button>
              <Button variant="secondary">{t("buttons.secondary")}</Button>
              <Button variant="outline">{t("buttons.outline")}</Button>
              <Button variant="destructive">{t("buttons.destructive")}</Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("buttons.moreOptions")}
              >
                <ArrowUpRight
                  aria-hidden="true"
                  className="rtl:-scale-x-100"
                />
              </Button>
            </div>
            <Separator />
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">{t("buttons.small")}</Button>
              <Button size="default">{t("buttons.default")}</Button>
              <Button size="lg">{t("buttons.large")}</Button>
              <Button variant="outline" disabled>
                {t("buttons.disabled")}
              </Button>
            </div>
          </Card>
        </section>

        <section aria-labelledby="inputs-heading" className="space-y-5">
          <div>
            <h2 id="inputs-heading" className="type-section-title">
              {t("inputs.title")}
            </h2>
            <p className="type-secondary mt-1">{t("inputs.description")}</p>
          </div>
          <Card className="gap-4">
            <div className="space-y-2">
              <label htmlFor="sample-name" className="type-label">
                {t("inputs.sampleLabel")}
              </label>
              <Input
                id="sample-name"
                placeholder={t("inputs.samplePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="sample-disabled" className="type-label">
                {t("inputs.disabledLabel")}
              </label>
              <Input
                id="sample-disabled"
                placeholder={t("inputs.disabledPlaceholder")}
                disabled
              />
            </div>
          </Card>
        </section>
      </div>

      <section aria-labelledby="cards-heading" className="space-y-5">
        <div>
          <h2 id="cards-heading" className="type-section-title">
            {t("cards.title")}
          </h2>
          <p className="type-secondary mt-1">{t("cards.description")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("cards.surfaceTitle")}</CardTitle>
              <CardDescription>
                {t("cards.surfaceDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="type-label mb-2">{t("cards.currencyLabel")}</p>
              <p className="type-numeric text-3xl">
                {formatCurrency(1240.5, locale)}
              </p>
            </CardContent>
          </Card>
          <Card className="justify-between">
            <CardHeader>
              <CardTitle>{t("cards.actionTitle")}</CardTitle>
              <CardDescription>{t("cards.actionDescription")}</CardDescription>
            </CardHeader>
            <Button variant="outline" className="self-start">
              {t("cards.learnMore")}
              <ArrowUpRight
                aria-hidden="true"
                className="rtl:-scale-x-100"
              />
            </Button>
          </Card>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="badges-heading" className="space-y-5">
          <div>
            <h2 id="badges-heading" className="type-section-title">
              {t("statuses.title")}
            </h2>
            <p className="type-secondary mt-1">{t("statuses.description")}</p>
          </div>
          <Card className="flex-row flex-wrap items-center gap-3">
            <Badge>
              <Check aria-hidden="true" /> {t("statuses.primary")}
            </Badge>
            <Badge variant="secondary">
              <Info aria-hidden="true" /> {t("statuses.neutral")}
            </Badge>
            <Badge variant="success">
              <CircleCheck aria-hidden="true" /> {t("statuses.success")}
            </Badge>
            <Badge variant="warning">
              <CircleAlert aria-hidden="true" /> {t("statuses.warning")}
            </Badge>
            <Badge variant="destructive">{t("statuses.destructive")}</Badge>
            <Badge variant="outline">{t("statuses.outline")}</Badge>
          </Card>
        </section>

        <section aria-labelledby="skeletons-heading" className="space-y-5">
          <div>
            <h2 id="skeletons-heading" className="type-section-title">
              {t("skeletons.title")}
            </h2>
            <p className="type-secondary mt-1">
              {t("skeletons.description")}
            </p>
          </div>
          <Card className="flex-row items-center gap-4">
            <Skeleton className="size-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <Skeleton className="hidden h-9 w-20 sm:block" />
          </Card>
        </section>
      </div>
    </main>
  );
}
