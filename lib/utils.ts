import type { PullRequest, ContributorStat, Digest } from '@/types'

export function classifyPRSize(additions: number, deletions: number): 'XS' | 'S' | 'M' | 'L' {
  const total = additions + deletions
  if (total < 10) return 'XS'
  if (total < 100) return 'S'
  if (total < 500) return 'M'
  return 'L'
}

export function computeCycleTimeHours(createdAt: string, mergedAt: string | null): number | null {
  if (!mergedAt) return null
  const ms = new Date(mergedAt).getTime() - new Date(createdAt).getTime()
  return Math.round((ms / (1000 * 60 * 60)) * 10) / 10
}

export function isStale(updatedAt: string, days = 7): boolean {
  return (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24) >= days
}

export function formatHours(hours: number | null): string {
  if (hours === null || hours === undefined) return '--'
  if (hours < 24) return `${hours}h`
  return `${Math.round((hours / 24) * 10) / 10}d`
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return '--'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateShort(dateString: string | null): string {
  if (!dateString) return '--'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function computeHealthScore(digest: Digest): number {
  let score = 100

  if (digest.avg_cycle_time_hours !== null) {
    if      (digest.avg_cycle_time_hours >= 48) score -= 25
    else if (digest.avg_cycle_time_hours >= 24) score -= 15
    else if (digest.avg_cycle_time_hours >= 12) score -= 8
    else if (digest.avg_cycle_time_hours >= 4)  score -= 3
  }

  const open = Math.max(digest.open_count, 1)
  const staleRatio = digest.stale_pr_count / open
  if      (staleRatio >= 0.5)  score -= 20
  else if (staleRatio >= 0.25) score -= 10
  else if (staleRatio >  0)    score -= 4

  score -= Math.min(30, digest.failed_job_names.length * 15)

  if (digest.pr_count > 0) {
    const rate = digest.merged_count / digest.pr_count
    if      (rate < 0.3) score -= 15
    else if (rate < 0.5) score -= 8
    else if (rate < 0.7) score -= 3
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

export function healthScoreColor(score: number): string {
  if (score >= 80) return '#3daa80'
  if (score >= 60) return '#c8a860'
  return '#c05060'
}

export interface DigestTrend {
  mergedDelta: number | null
  cycleDelta:  number | null
  staleDelta:  number | null
  scoreDelta:  number | null
}

export function computeTrend(current: Digest, previous: Digest | null): DigestTrend {
  if (!previous) return { mergedDelta: null, cycleDelta: null, staleDelta: null, scoreDelta: null }
  return {
    mergedDelta: current.merged_count - previous.merged_count,
    cycleDelta:
      current.avg_cycle_time_hours !== null && previous.avg_cycle_time_hours !== null
        ? Math.round((current.avg_cycle_time_hours - previous.avg_cycle_time_hours) * 10) / 10
        : null,
    staleDelta: current.stale_pr_count - previous.stale_pr_count,
    scoreDelta: computeHealthScore(current) - computeHealthScore(previous),
  }
}

export function trendArrow(delta: number | null, lowerIsBetter = false): string {
  if (delta === null || delta === 0) return ''
  return (delta > 0) !== lowerIsBetter ? ' ↑' : ' ↓'
}

export function trendColor(delta: number | null, lowerIsBetter = false): string {
  if (delta === null || delta === 0) return 'var(--tm)'
  const good = lowerIsBetter ? delta < 0 : delta > 0
  return good ? '#3daa80' : '#c05060'
}

export function formatDigestPeriod(start: string | null, end: string | null): string {
  const s = formatDateShort(start)
  const e = formatDateShort(end)
  return s === e || !end ? s : `${s} — ${e}`
}

export function formatDigestPeriodFull(start: string | null, end: string | null): string {
  const s = formatDate(start)
  const e = formatDate(end)
  return s === e || !end ? s : `${s} — ${e}`
}

export function getContributorStats(prs: PullRequest[]): ContributorStat[] {
  const map = new Map<string, { prs: number; merged: number }>()

  for (const pr of prs) {
    const s = map.get(pr.author) ?? { prs: 0, merged: 0 }
    map.set(pr.author, {
      prs: s.prs + 1,
      merged: s.merged + (pr.merged ? 1 : 0),
    })
  }

  return Array.from(map.entries())
    .map(([author, s]) => ({
      author,
      prs: s.prs,
      merged: s.merged,
      rate: s.prs > 0 ? Math.round((s.merged / s.prs) * 100) : 0,
    }))
    .sort((a, b) => b.prs - a.prs)
}
