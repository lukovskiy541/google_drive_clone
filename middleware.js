import { NextResponse } from 'next/server';

const AUTH_COOKIE = 'drive_token';
const AUTH_ONLY = ['/dashboard'];
const GUEST_ONLY = ['/login', '/register'];

export function middleware(request) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  if (!token && AUTH_ONLY.some((prefix) => pathname.startsWith(prefix))) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (token && GUEST_ONLY.some((prefix) => pathname.startsWith(prefix))) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
