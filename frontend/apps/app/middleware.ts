import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  if (process.env.VERCEL_ENV !== 'production') {
    return NextResponse.next()
  }

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

  return NextResponse.next()
}

export const config = {
  matcher: '/erd/:path*',
}
