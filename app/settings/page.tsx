import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import SettingsClient from '@/components/SettingsClient'
import type { Repo } from '@/types'

export default async function SettingsPage() {
  let session = null
  try {
    session = await getServerSession(authOptions)
  } catch {
    // stale / invalid JWT cookie
  }
  if (!session) redirect('/')

  let user: { id: string } | null = null
  try {
    const { data } = await supabaseAdmin.from('users').select('id').eq('github_id', session.user.githubId).single()
    user = data
  } catch { /* Supabase not configured yet */ }

  const repos: Repo[] = []
  if (user) {
    try {
      const { data: r } = await supabaseAdmin.from('repos').select('*').eq('user_id', user.id).order('connected_at', { ascending: false })
      repos.push(...((r ?? []) as Repo[]))
    } catch { /* Supabase not configured yet */ }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar active="settings" githubLogin={session.user.githubLogin} />
      <SettingsClient
        repos={repos}
        githubLogin={session.user.githubLogin}
        email={session.user.email ?? null}
      />
    </div>
  )
}
