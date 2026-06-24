import { NextResponse } from "next/server";
import { verifySessionCookieServer } from "@/lib/auth/verify-session-proxy";
import {
  SESSION_COOKIE_NAME,
  ROLE,
  LOGIN_PATH,
  DASHBOARD_PATH,
} from "@/lib/auth/constants";

function isAuthPath(pathname) {
  return (
    pathname === "/user/signup" ||
    pathname === "/manager/login" ||
    pathname === "/manager/signup"
  );
}

function homeForRole(role) {
  if (role === ROLE.ADMIN) return DASHBOARD_PATH[ROLE.ADMIN];
  if (role === ROLE.USER) return DASHBOARD_PATH[ROLE.USER];
  if (role === ROLE.MANAGER) return DASHBOARD_PATH[ROLE.MANAGER];
  return "/";
}

function loginForPath(pathname) {
  if (pathname.startsWith("/admin")) return LOGIN_PATH[ROLE.ADMIN];
  if (pathname.startsWith("/user")) return LOGIN_PATH[ROLE.USER];
  if (pathname.startsWith("/manager")) return LOGIN_PATH[ROLE.MANAGER];
  return LOGIN_PATH[ROLE.USER];
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/login" ||
    pathname === "/admin/login" ||
    pathname === "/user/login"
  ) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (sessionCookie) {
      try {
        const decoded = await verifySessionCookieServer(sessionCookie);
        const role = decoded.role;
        if (
          role === ROLE.ADMIN ||
          role === ROLE.USER ||
          role === ROLE.MANAGER
        ) {
          const url = request.nextUrl.clone();
          url.pathname = homeForRole(role);
          url.search = "";
          return NextResponse.redirect(url);
        }
      } catch {
        /* stale cookie — continue */
      }
    }
    if (pathname === "/admin/login" || pathname === "/user/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isUserRoute = pathname.startsWith("/user");
  const isManagerRoute = pathname.startsWith("/manager");

  if (!isAdminRoute && !isUserRoute && !isManagerRoute) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (isAuthPath(pathname)) {
    if (sessionCookie) {
      try {
        const decoded = await verifySessionCookieServer(sessionCookie);
        const role = decoded.role;
        if (role === ROLE.ADMIN || role === ROLE.USER || role === ROLE.MANAGER) {
          const url = request.nextUrl.clone();
          url.pathname = homeForRole(role);
          url.search = "";
          return NextResponse.redirect(url);
        }
      } catch {
        /* stale cookie — allow login page */
      }
    }
    return NextResponse.next();
  }

  if (!sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = loginForPath(pathname);
    url.search = "";
    return NextResponse.redirect(url);
  }

  let decoded;
  try {
    decoded = await verifySessionCookieServer(sessionCookie);
  } catch {
    const url = request.nextUrl.clone();
    url.pathname = loginForPath(pathname);
    url.search = "";
    return NextResponse.redirect(url);
  }

  const role = decoded.role;
  if (role !== ROLE.ADMIN && role !== ROLE.USER && role !== ROLE.MANAGER) {
    const url = request.nextUrl.clone();
    url.pathname = loginForPath(pathname);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isAdminRoute && role !== ROLE.ADMIN) {
    const url = request.nextUrl.clone();
    url.pathname = homeForRole(role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isUserRoute && role !== ROLE.USER) {
    const url = request.nextUrl.clone();
    url.pathname = homeForRole(role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isManagerRoute && role !== ROLE.MANAGER) {
    const url = request.nextUrl.clone();
    url.pathname = homeForRole(role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/admin",
    "/admin/:path*",
    "/user",
    "/user/:path*",
    "/manager",
    "/manager/:path*",
  ],
};
