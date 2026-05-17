export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/repos/:path*',
    '/settings/:path*',
    '/api/repos/:path*',
    '/api/reports/:path*',
    '/api/github/:path*',
    '/api/digests/:path*',
  ],
}
