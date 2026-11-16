"use client";

import { Eye, EyeOff, LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/theme/language-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useRouter } from "@/i18n/navigation";
import {
  getRoleHomePath,
  InvalidCredentialsError,
} from "../services/mock-auth-service";
import { useAuth } from "../providers/auth-provider";

type FormErrors = {
  email?: string;
  password?: string;
  credentials?: string;
};

export function LoginPage() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const { user, isLoading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!isLoading && user) router.replace(getRoleHomePath(user.role));
  }, [isLoading, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const passwordValue = formData.get("password");
    const password = typeof passwordValue === "string" ? passwordValue : "";
    const nextErrors: FormErrors = {};
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      nextErrors.email = t("validation.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = t("validation.emailInvalid");
    }
    if (!password) nextErrors.password = t("validation.passwordRequired");
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const session = await login({ email: normalizedEmail, password });
      form.reset();
      router.replace(getRoleHomePath(session.user.role));
    } catch (error) {
      setErrors({
        credentials:
          error instanceof InvalidCredentialsError
            ? t("validation.invalidCredentials")
            : t("validation.loginFailed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-muted/30 px-6 py-10">
      <div className="absolute end-6 top-6 flex items-center gap-2">
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

      <div className="grid w-full max-w-5xl grid-cols-2 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <section className="flex flex-col justify-between bg-primary p-10 text-primary-foreground">
          <div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary-foreground/15 text-lg font-bold">
              POS
            </div>
            <p className="mt-10 text-sm font-medium text-primary-foreground/75">
              {t("eyebrow")}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-primary-foreground/80">
              {t("description")}
            </p>
          </div>
        </section>

        <section className="p-10">
          <Card className="border-0 bg-transparent p-0 shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="text-2xl">{t("formTitle")}</CardTitle>
              <CardDescription>{t("formDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="mt-7 p-0">
              <form noValidate onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="login-email" className="text-sm font-medium">
                    {t("email")}
                  </label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.currentTarget.value);
                      setErrors({});
                    }}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "login-email-error" : undefined}
                    required
                  />
                  {errors.email && (
                    <p id="login-email-error" role="alert" className="text-sm text-destructive">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="login-password" className="text-sm font-medium">
                    {t("password")}
                  </label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      onChange={() => setErrors({})}
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={
                        errors.password ? "login-password-error" : undefined
                      }
                      className="pe-12"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t(showPassword ? "hidePassword" : "showPassword")}
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute end-1 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff aria-hidden="true" />
                      ) : (
                        <Eye aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p id="login-password-error" role="alert" className="text-sm text-destructive">
                      {errors.password}
                    </p>
                  )}
                </div>

                {errors.credentials && (
                  <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {errors.credentials}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || isLoading}
                >
                  <LogIn aria-hidden="true" />
                  {isSubmitting ? t("submitting") : t("submit")}
                </Button>
              </form>

            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
