import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getOrCreateUserId } from '@/lib/user'
import { NextResponse } from 'next/server'

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await getOrCreateUserId(session)
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const user = { id: userId }

  // Verify ownership via repo join
  const { data: digest } = await supabaseAdmin
    .from('digests')
    .select('id, repo_id, repos!inner(user_id)')
    .eq('id', id)
    .single()

  if (!digest) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const repoUserId = (digest as unknown as { repos?: { user_id: string } }).repos?.user_id
  if (repoUserId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabaseAdmin.from('digests').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
