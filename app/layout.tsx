import type { Metadata } from 'next'
import './globals.css'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import SessionProvider from '@/components/SessionProvider'

export const metadata: Metadata = {
  title: 'DevDigest',
  description: 'GitHub PR intelligence for engineering teams',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let session = null
  try {
    session = await getServerSession(authOptions)
  } catch {
    // stale / invalid JWT cookie — treat as unauthenticated
  }

  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  )
}
