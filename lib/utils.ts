import type { PullRequest, ContributorStat } from '@/types'

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
