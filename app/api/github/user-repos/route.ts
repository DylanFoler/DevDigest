import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Octokit } from '@octokit/rest'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const username = new URL(req.url).searchParams.get('username')
  if (!username) return NextResponse.json({ error: 'username is required' }, { status: 400 })

  const octokit = new Octokit({ auth: session.accessToken })

  try {
    const { data } = await octokit.repos.listForUser({
      username,
      sort: 'updated',
      per_page: 50,
    })
    return NextResponse.json({ repos: data })
  } catch (e: unknown) {
    const status = (e as { status?: number }).status
    if (status === 404) return NextResponse.json({ error: `User "${username}" not found` }, { status: 404 })
    const msg = e instanceof Error ? e.message : 'Failed to fetch repos'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
