import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getOrCreateUserId } from '@/lib/user'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await getOrCreateUserId(session)
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: repos, error } = await supabaseAdmin
    .from('repos')
    .select('*')
    .eq('user_id', userId)
    .order('connected_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ repos })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await getOrCreateUserId(session)
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json()
  const { github_repo_id, owner, name, full_name } = body

  if (!github_repo_id || !owner || !name || !full_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: repo, error } = await supabaseAdmin
    .from('repos')
    .upsert(
      { user_id: userId, github_repo_id: String(github_repo_id), owner, name, full_name },
      { onConflict: 'github_repo_id,user_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ repo })
}
