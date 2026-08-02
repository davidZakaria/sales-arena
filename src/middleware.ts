import createIntlMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/agency",
  "/open-race",
  "/portfolio",
  "/manager",
  "/operations",
  "/finance",
];

function stripLocale(pathname: string) {
  return pathname.replace(/^\/(en|ar)/, "") || "/";
}

function getLocaleFromPathname(pathname: string): string {
  const match = pathname.match(/^\/(en|ar)(?:\/|$)/);
  return match?.[1] ?? routing.defaultLocale;
}

function isPublicPath(pathnameWithoutLocale: string) {
  if (pathnameWithoutLocale === "/login" || pathnameWithoutLocale.startsWith("/login/")) {
    return true;
  }
  if (pathnameWithoutLocale === "/join" || pathnameWithoutLocale.startsWith("/join/")) {
    return true;
  }
  if (pathnameWithoutLocale.startsWith("/broker-join")) {
    return true;
  }
  return false;
}

function isProtectedPath(pathnameWithoutLocale: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) =>
      pathnameWithoutLocale === prefix || pathnameWithoutLocale.startsWith(`${prefix}/`),
  );
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const intlResponse = intlMiddleware(req);
  const pathnameWithoutLocale = stripLocale(pathname);
  const locale = getLocaleFromPathname(pathname);

  if (isPublicPath(pathnameWithoutLocale) || !isProtectedPath(pathnameWithoutLocale)) {
    return intlResponse;
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const signInUrl = new URL(`/${locale}/login`, req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return intlResponse;
}

export const config = {
  matcher: ["/", "/(ar|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
