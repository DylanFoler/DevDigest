import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getOrCreateUserId } from '@/lib/user'
import { Octokit } from '@octokit/rest'
import { generateDigest } from '@/lib/claude'
import { classifyPRSize, computeCycleTimeHours, isStale } from '@/lib/utils'
import { NextResponse } from 'next/server'
import type { PullRequest, WorkflowRun, SizeDistribution } from '@/types'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await getOrCreateUserId(session)
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const user = { id: userId }

  const repoId = new URL(req.url).searchParams.get('repo_id')

  const { data: repos } = await supabaseAdmin
    .from('repos')
    .select('id')
    .eq('user_id', user.id)

  const repoIds = (repos ?? []).map((r: { id: string }) => r.id)
  if (!repoIds.length) return NextResponse.json({ digests: [] })

  let query = supabaseAdmin
    .from('digests')
    .select('*')
    .in('repo_id', repoIds)
    .order('created_at', { ascending: false })

  if (repoId) query = query.eq('repo_id', repoId)

  const { data: digests, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ digests })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let repo_id: string
  try {
    const body = await req.json()
    repo_id = body.repo_id
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
  const userId = await getOrCreateUserId(session)
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const user = { id: userId }

  const { data: repo } = await supabaseAdmin
    .from('repos')
    .select('*')
    .eq('id', repo_id)
    .eq('user_id', user.id)
    .single()

  if (!repo) return NextResponse.json({ error: 'Repo not found' }, { status: 404 })

  const octokit = new Octokit({ auth: session.accessToken })

  // Fetch PRs
  const { data: rawPRs } = await octokit.pulls.list({
    owner: repo.owner,
    repo: repo.name,
    state: 'all',
    per_page: 30,
    sort: 'updated',
  })

  const periodStart = rawPRs.length > 0 ? rawPRs[rawPRs.length - 1].created_at : new Date().toISOString()
  const periodEnd = new Date().toISOString()

  const prs: PullRequest[] = rawPRs.map((pr) => {
    const merged = !!pr.merged_at
    const additions = (pr as { additions?: number }).additions ?? 0
    const deletions = (pr as { deletions?: number }).deletions ?? 0
    return {
      number: pr.number,
      title: pr.title,
      state: pr.state,
      merged,
      merged_at: pr.merged_at ?? null,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      author: pr.user?.login ?? 'unknown',
      additions,
      deletions,
      labels: pr.labels.map((l) => (typeof l === 'string' ? l : (l.name ?? ''))).filter(Boolean),
      size: classifyPRSize(additions, deletions),
      cycle_time_hours: merged ? computeCycleTimeHours(pr.created_at, pr.merged_at ?? null) : null,
      review_time_hours: null,
      is_stale: !merged && isStale(pr.updated_at),
    }
  })

  // Fetch workflow runs
  const { data: runsData } = await octokit.actions.listWorkflowRunsForRepo({
    owner: repo.owner,
    repo: repo.name,
    per_page: 10,
  })

  const workflow_runs: WorkflowRun[] = runsData.workflow_runs.map((r) => ({
    id: r.id,
    name: r.name ?? 'Unknown',
    status: r.status ?? 'unknown',
    conclusion: r.conclusion ?? null,
    created_at: r.created_at,
  }))

  const failedJobNames = Array.from(
    new Set(workflow_runs.filter((r) => r.conclusion === 'failure').map((r) => r.name))
  )

  const dist: SizeDistribution = { xs: 0, s: 0, m: 0, l: 0 }
  for (const pr of prs) {
    if (pr.size === 'XS') dist.xs++
    else if (pr.size === 'S') dist.s++
    else if (pr.size === 'M') dist.m++
    else dist.l++
  }

  const mergedPRs = prs.filter((p) => p.merged)
  const openPRs = prs.filter((p) => !p.merged && p.state === 'open')
  const cycleTimes = mergedPRs.map((p) => p.cycle_time_hours).filter((h): h is number => h !== null)
  const avgCycleTime =
    cycleTimes.length > 0
      ? Math.round((cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length) * 10) / 10
      : null

  const { summary, key_changes, release_notes } = await generateDigest(
    prs,
    failedJobNames,
    repo.full_name
  )

  const { data: digest, error } = await supabaseAdmin
    .from('digests')
    .insert({
      repo_id: repo.id,
      period_start: periodStart,
      period_end: periodEnd,
      summary,
      pr_count: prs.length,
      merged_count: mergedPRs.length,
      open_count: openPRs.length,
      avg_cycle_time_hours: avgCycleTime,
      avg_review_time_hours: null,
      pr_size_distribution: dist,
      stale_pr_count: prs.filter((p) => p.is_stale).length,
      failed_job_names: failedJobNames,
      release_notes,
      raw_data: { prs, workflow_runs, key_changes },
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ digest })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Report generation failed'
    console.error('report generation error:', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
