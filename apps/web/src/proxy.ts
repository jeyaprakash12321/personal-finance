import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("wealthly_token")?.value;
  const { pathname } = request.nextUrl;
  const isPublicRoute = ["/login", "/register"].some((route) => pathname.startsWith(route));

  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!token && (!isPublicRoute || pathname === "/")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
