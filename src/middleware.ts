import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Legacy /:lang/catalog?cat=slug URLs → /:lang/catalog/slug (true 308 here,
  // before streaming starts — the page-level redirect can only meta-refresh)
  const match = pathname.match(/^\/(ru|en|ar)\/catalog\/?$/);
  const cat = searchParams.get("cat");
  if (match && cat && /^[a-z0-9-]+$/.test(cat)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${match[1]}/catalog/${cat}`;
    url.searchParams.delete("cat");
    return NextResponse.redirect(url, 308);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
