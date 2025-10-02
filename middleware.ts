import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Admin routes
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "admin") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // HR routes
    if (pathname.startsWith("/hr")) {
      if (token?.role !== "hr" && token?.role !== "admin") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Employee routes (accessible by all authenticated users)
    if (pathname.startsWith("/employee")) {
      // All authenticated users can access
    }

    // Payroll routes (HR and Admin only)
    if (pathname.includes("/payroll")) {
      if (token?.role !== "hr" && token?.role !== "admin") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/hr/:path*",
    "/employee/:path*",
    "/dashboard/:path*"
  ],
};