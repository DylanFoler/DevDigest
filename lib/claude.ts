import Anthropic from '@anthropic-ai/sdk'
import type { PullRequest } from '@/types'

let _client: Anthropic | null = null

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return _client
}

export interface DigestContent {
  summary: string
  key_changes: string[]
  release_notes: string
}

export async function generateDigest(
  prs: PullRequest[],
  failedJobs: string[],
  repoName: string
): Promise<DigestContent> {
  const client = getClient()
  if (!client) return buildFallback(prs, failedJobs)

  const prList = prs
    .map(
      (p) =>
        `[${p.merged ? 'MERGED' : p.state.toUpperCase()}] #${p.number} "${p.title}" by ${p.author} (${p.size}, +${p.additions}/-${p.deletions}) labels: ${p.labels.join(', ') || 'none'}`
    )
    .join('\n')

  const stalePRs = prs.filter((p) => p.is_stale)

  const prompt = `You are a senior engineering manager writing a weekly PR digest for the repository: ${repoName}.

PRs (last 30 days):
${prList}

Failed CI jobs: ${failedJobs.length > 0 ? failedJobs.join(', ') : 'none'}
Stale PRs (no activity 7+ days): ${stalePRs.length}

Write exactly 3 paragraphs:
1. What shipped: reference specific PR titles, numbers, and author names. Do not say "the team" without naming people.
2. What is in flight: specific open PRs with author and context.
3. Risk areas and CI health: specific numbers, job names, stale PR details.

Then on a new line:
KEY CHANGES:
- (3-5 bullets, each referencing an exact PR title, number, and author)

RELEASE NOTES:
(Group merged PRs by label: feat, fix, chore. List specific titles. Use "Other" if unlabeled.)

Strict rules:
- No em dashes anywhere. Use commas or colons instead.
- Every claim must reference a specific PR number, title, or metric.
- No vague summaries.
- Be direct and technical.`

  const resp = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = resp.content[0].type === 'text' ? resp.content[0].text : ''
  return parseResponse(text)
}

function parseResponse(text: string): DigestContent {
  const keyIdx = text.indexOf('\nKEY CHANGES:')
  const releaseIdx = text.indexOf('\nRELEASE NOTES:')

  const summary = keyIdx > 0 ? text.slice(0, keyIdx).trim() : text.trim()

  const keyBlock =
    keyIdx > 0 ? text.slice(keyIdx + 14, releaseIdx > 0 ? releaseIdx : undefined) : ''
  const key_changes = keyBlock
    .split('\n')
    .map((l) => l.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)

  const release_notes = releaseIdx > 0 ? text.slice(releaseIdx + 16).trim() : ''

  return { summary, key_changes, release_notes }
}

function buildFallback(prs: PullRequest[], failedJobs: string[]): DigestContent {
  const merged = prs.filter((p) => p.merged)
  const open = prs.filter((p) => !p.merged && p.state === 'open')
  const top3 = merged.slice(0, 3)

  const para1 =
    merged.length === 0
      ? 'No PRs were merged in this period.'
      : `${merged.length} PR${merged.length !== 1 ? 's' : ''} merged: ${top3.map((p) => `"${p.title}" (#${p.number}) by ${p.author}`).join(', ')}${merged.length > 3 ? `, and ${merged.length - 3} more` : ''}.`

  const para2 =
    open.length === 0
      ? 'No open PRs.'
      : `${open.length} PR${open.length !== 1 ? 's' : ''} currently open: ${open
          .slice(0, 3)
          .map((p) => `#${p.number} "${p.title}"`)
          .join(', ')}${open.length > 3 ? '...' : ''}.`

  const para3 =
    failedJobs.length === 0
      ? 'CI checks passing.'
      : `${failedJobs.length} failing CI job${failedJobs.length !== 1 ? 's' : ''}: ${failedJobs.join(', ')}.`

  const key_changes = top3.map((p) => `${p.title} (#${p.number}) by ${p.author}`)

  const release_notes =
    merged.length > 0
      ? `Other:\n${merged.map((p) => `- ${p.title} (#${p.number})`).join('\n')}`
      : 'No PRs merged in this period.'

  return {
    summary: [para1, para2, para3].join(' '),
    key_changes,
    release_notes,
  }
}
