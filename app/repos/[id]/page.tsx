import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import RepoDetailClient from '@/components/RepoDetailClient'
import type { Repo, Digest } from '@/types'

export default async function RepoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
  if (!user) redirect('/')

  const { data: repo } = await supabaseAdmin
    .from('repos')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!repo) notFound()

  const { data: digests } = await supabaseAdmin
    .from('digests')
    .select('*')
    .eq('repo_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar active="repos" githubLogin={session.user.githubLogin} />
      <RepoDetailClient repo={repo as Repo} initialDigests={(digests ?? []) as Digest[]} />
    </div>
  )
}
