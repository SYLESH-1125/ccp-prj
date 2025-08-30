import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/notifications',
  '/admin',
  '/citizen', 
  '/maintenance',
  '/report',
  '/status',
  '/playground'
]

// List of auth routes that should redirect if already logged in
const authRoutes = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if user is authenticated (this is a simple check - in production use proper JWT validation)
  const userRole = request.cookies.get('userRole')?.value
  const isAuthenticated = !!userRole

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.includes(pathname)

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to appropriate dashboard if already authenticated and trying to access auth routes
  if (isAuthRoute && isAuthenticated) {
    switch (userRole) {
      case 'admin':
        return NextResponse.redirect(new URL('/admin', request.url))
      case 'citizen':
        return NextResponse.redirect(new URL('/citizen', request.url))
      case 'maintenance':
        return NextResponse.redirect(new URL('/maintenance', request.url))
      default:
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
