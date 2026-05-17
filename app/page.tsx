import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LoginPage from '@/components/LoginPage'

export default async function Home() {
  let session = null
  try {
    session = await getServerSession(authOptions)
  } catch {
    // stale / invalid JWT cookie — treat as unauthenticated
  }
  if (session) redirect('/dashboard')
  return <LoginPage />
}
