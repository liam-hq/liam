import { createServerClient } from '@liam-hq/db'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { ROUTE_PREFIXES } from './libs/routes/constants'

export async function updateSession(request: NextRequest) {
  // Skip middleware for public routes, erd pages, and static files
  if (
    request.nextUrl.pathname.startsWith(ROUTE_PREFIXES.PUBLIC) ||
    request.nextUrl.pathname.startsWith(ROUTE_PREFIXES.ERD)
  ) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          supabaseResponse = NextResponse.next({
            request,
          })
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith(ROUTE_PREFIXES.LOGIN) &&
    !request.nextUrl.pathname.startsWith(ROUTE_PREFIXES.AUTH) &&
    !request.nextUrl.pathname.startsWith(ROUTE_PREFIXES.PUBLIC)
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = ROUTE_PREFIXES.LOGIN

    // Create the redirect response
    const redirectResponse = NextResponse.redirect(url)

    // Also store the return URL in a cookie
    redirectResponse.cookies.set('returnTo', request.nextUrl.pathname, {
      path: '/',
      maxAge: 60 * 60, // 1 hour expiration
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return redirectResponse
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}

export async function middleware(request: NextRequest) {
  // Check if accessing /erd/* paths directly without the proper rewrite header (production only)
  if (
    request.nextUrl.pathname.startsWith(ROUTE_PREFIXES.ERD) &&
    process.env.VERCEL_ENV === 'production'
  ) {
    const allowedSource = 'liambx.com'
    const rewriteSource = request.headers.get('x-liam-rewrite-source')

    // Block direct access to /erd/* - only allow access via rewrite in production
    if (rewriteSource !== allowedSource) {
      console.info('ERD access denied: Direct access blocked', {
        path: request.nextUrl.pathname,
        received: rewriteSource,
        expected: allowedSource,
      })

      return new NextResponse(
        `Direct access to /erd/* is not allowed. Please access via https://${allowedSource}/erd/`,
        {
          status: 403,
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            Pragma: 'no-cache',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
        },
      )
    }
  }

  const response = await updateSession(request)
  // NOTE: Set the x-url-path header to allow extracting the current path in layout.tsx and other components
  // @see: https://github.com/vercel/next.js/issues/43704#issuecomment-1411186664
  response.headers.set('x-url-path', request.nextUrl.pathname)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
