import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedAdminPaths = ["/admin/dashboard", "/admin/articles"];

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;
  const accountType = req.cookies.get("accountType")?.value;

  // Allow /admin/login without authentication
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Check if path requires admin authentication
  if (protectedAdminPaths.some((path) => pathname.startsWith(path))) {
    if (!token || accountType !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // Redirect to profile if accessing root and logged in
  if (pathname === "/" && token && accountType) {
    const url = req.nextUrl.clone();
    if (accountType === "employer") {
      url.pathname = "/employer/profile";
    } else if (accountType === "worker") {
      url.pathname = "/worker/profile";
    }
    return NextResponse.redirect(url);
  }

  // Redirect to signin if not logged in and accessing protected routes
  if (!token && !pathname.startsWith("/signin") && !pathname.startsWith("/reset-password") && !pathname.startsWith("/update-password")) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to profile if logged in and accessing signin
  if (pathname === "/signin" && token && accountType) {
    const url = req.nextUrl.clone();
    if (accountType === "employer") {
      url.pathname = "/employer/profile";
    } else if (accountType === "worker") {
      url.pathname = "/worker/profile";
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/employer/:path*", "/worker/:path*", "/messages/:path*", "/notifications/:path*", "/verification/:path*", "/signin"],
};
