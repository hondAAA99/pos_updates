import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, routing } from "./i18n/routing";
import {
  getRoleHomePath,
  isAuthRoleValue,
} from "./features/auth/services/mock-auth-service";
import { canAccessRoute } from "./features/auth/services/rbac";

const handleI18nRouting = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split("/").filter(Boolean);
  const localeSegment = segments[0];

  if (!isLocale(localeSegment)) {
    if (pathname === "/") {
      return NextResponse.redirect(
        new URL(`/${defaultLocale}/login`, request.url),
      );
    }
    return handleI18nRouting(request);
  }

  const locale = localeSegment;
  const route = segments.slice(1).join("/");
  const roleCookie = request.cookies.get("pos_session")?.value;
  const authenticatedRole = isAuthRoleValue(roleCookie)
    ? roleCookie
    : undefined;

  if (route === "login") {
    if (authenticatedRole) {
      return NextResponse.redirect(
        new URL(
          `/${locale}${getRoleHomePath(authenticatedRole)}`,
          request.url,
        ),
      );
    }
    return handleI18nRouting(request);
  }

  if (!authenticatedRole) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  if (!route) {
    return NextResponse.redirect(
      new URL(`/${locale}${getRoleHomePath(authenticatedRole)}`, request.url),
    );
  }

  if (!canAccessRoute(authenticatedRole, `/${route}`)) {
    return NextResponse.redirect(new URL(`/${locale}/access-denied`, request.url));
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
