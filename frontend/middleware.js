import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('erp_token')?.value
  const role  = request.cookies.get('erp_role')?.value

  const isLoggedIn = !!token

  // ── Protect dashboard routes ─────────────────────────────────────────────
  // Not logged in or wrong role trying to access admin dashboard
  if (pathname.startsWith('/admin/dashboard')) {
    if (!isLoggedIn || role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Not logged in or wrong role trying to access superadmin dashboard
  if (pathname.startsWith('/superadmin/dashboard')) {
    if (!isLoggedIn || role !== 'superadmin') {
      return NextResponse.redirect(new URL('/superadmin/login', request.url))
    }
  }

  // ── Redirect already-logged-in users away from auth pages ───────────────
  if (isLoggedIn) {
    // Admin already logged in — back button to /admin/login → push to dashboard
    if (pathname === '/admin/login' && role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }

    // Superadmin already logged in — back button to /superadmin/login → push to dashboard
    if (pathname === '/superadmin/login' && role === 'superadmin') {
      return NextResponse.redirect(new URL('/superadmin/dashboard', request.url))
    }

    // Home page — auto-route to the right dashboard
    if (pathname === '/') {
      if (role === 'admin')      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      if (role === 'superadmin') return NextResponse.redirect(new URL('/superadmin/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  // Run middleware only on these paths — skip static assets, _next internals, api routes
  matcher: [
    '/',
    '/admin/login',
    '/admin/dashboard/:path*',
    '/superadmin/login',
    '/superadmin/dashboard/:path*',
  ],
}
