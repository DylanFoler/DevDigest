import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import DashboardClient from '@/components/DashboardClient'
import type { Repo, Digest } from '@/types'

export default async function DashboardPage() {
  let session = null
  try {
    session = await getServerSession(authOptions)
  } catch {
    // stale / invalid JWT cookie
  }
  if (!session) redirect('/')

  let user: { id: string } | null = null
  try {
    const { data } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('github_id', session.user.githubId)
      .single()
    user = data
  } catch { /* Supabase not configured yet */ }

  const repos: Repo[] = []
  const digests: Digest[] = []

  if (user) {
    try {
      const { data: r } = await supabaseAdmin
        .from('repos')
        .select('*')
        .eq('user_id', user.id)
        .order('connected_at', { ascending: false })
      repos.push(...((r ?? []) as Repo[]))
    } catch { /* Supabase not configured yet */ }

    const repoIds = repos.map((r) => r.id)
    if (repoIds.length) {
      try {
        const { data: d } = await supabaseAdmin
          .from('digests')
          .select('*')
          .in('repo_id', repoIds)
          .order('created_at', { ascending: false })
        digests.push(...((d ?? []) as Digest[]))
      } catch { /* Supabase not configured yet */ }
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar active="dashboard" githubLogin={session.user.githubLogin} />
      <DashboardClient
        initialRepos={repos}
        initialDigests={digests}
        githubLogin={session.user.githubLogin}
      />
    </div>
  )
}
