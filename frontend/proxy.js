import { NextResponse } from 'next/server'

export function proxy(request) {
  const { pathname, searchParams } = request.nextUrl
  const token = request.cookies.get('erp_token')?.value
  const role  = request.cookies.get('erp_role')?.value

  // Protect dashboard routes — no valid session → go to login
  if (pathname.startsWith('/superadmin/dashboard')) {
    if (!token || role !== 'superadmin') {
      return NextResponse.redirect(new URL('/superadmin/login', request.url))
    }
  }

  if (pathname.startsWith('/admin/dashboard')) {
    if (!token || role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // "Already logged in" convenience redirects.
  // Skip when 'reason' param is present (e.g. reason=subscription_deactivated) —
  // that means the dashboard sent us here because the session is broken, and
  // bouncing back would create an infinite 307 loop.
  if (!searchParams.get('reason')) {
    if (pathname === '/superadmin/login' && token && role === 'superadmin') {
      return NextResponse.redirect(new URL('/superadmin/dashboard', request.url))
    }

    if (pathname === '/admin/login' && token && role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/superadmin/:path*', '/admin/:path*'],
}
