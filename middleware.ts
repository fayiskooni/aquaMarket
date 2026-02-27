import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const { role } = token;

    // Role-based route protection
    if (path.startsWith("/dashboard/user") && role !== "CUSTOMER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (path.startsWith("/dashboard/provider") && role !== "PROVIDER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (path.startsWith("/dashboard/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Default dashboard redirect based on role if hitting /dashboard directly
    if (path === "/dashboard") {
      if (role === "CUSTOMER") {
        return NextResponse.redirect(new URL("/dashboard/user", req.url));
      } else if (role === "PROVIDER") {
        return NextResponse.redirect(new URL("/dashboard/provider", req.url));
      } else if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard/admin", req.url));
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
  matcher: ["/dashboard/:path*", "/api/protected/:path*"],
};
