import { supabaseAdmin } from './supabase'
import type { Session } from 'next-auth'

export async function getOrCreateUserId(session: Session): Promise<string | null> {
  const { githubId, githubLogin } = session.user
  const email = session.user.email ?? null

  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('github_id', githubId)
    .single()

  if (existing?.id) return existing.id

  const { data: created } = await supabaseAdmin
    .from('users')
    .upsert(
      { github_id: githubId, github_login: githubLogin, email },
      { onConflict: 'github_id' }
    )
    .select('id')
    .single()

  return created?.id ?? null
}
