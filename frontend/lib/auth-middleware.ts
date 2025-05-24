import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token");
  const { pathname } = request.nextUrl;

  // Protected routes that require authentication
  const protectedRoutes = [
    "/dashboard",
    "/files",
    "/governance",
    "/iot",
    "/chat",
    "/assistant"
  ];

  // Authentication routes (only for non-authenticated users)
  const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // If the user is not authenticated and trying to access a protected route
  if (isProtectedRoute && !token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // If the user is authenticated and trying to access an auth route
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/files/:path*",
    "/governance/:path*",
    "/iot/:path*",
    "/chat/:path*",
    "/assistant/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password/:path*"
  ],
}; 