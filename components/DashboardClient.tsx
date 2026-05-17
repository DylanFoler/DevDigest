'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Repo, Digest } from '@/types'
import ConnectRepoModal from './ConnectRepoModal'
import { formatDate, formatHours } from '@/lib/utils'

interface Props {
  initialRepos: Repo[]
  initialDigests: Digest[]
  githubLogin: string
}

export default function DashboardClient({ initialRepos, initialDigests, githubLogin }: Props) {
  const [repos, setRepos] = useState<Repo[]>(initialRepos)
  const [digests, setDigests] = useState<Digest[]>(initialDigests)
  const [showModal, setShowModal] = useState(false)
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [error, setError] = useState('')

  const totalDigests = digests.length
  const cycleTimes = digests
    .map((d) => d.avg_cycle_time_hours)
    .filter((h): h is number => h !== null)
  const globalAvgCycle =
    cycleTimes.length > 0
      ? Math.round((cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length) * 10) / 10
      : null

  function latestDigestFor(repoId: string): Digest | undefined {
    return digests.find((d) => d.repo_id === repoId)
  }

  function handleConnected(repo: Repo) {
    setRepos((prev) => [repo, ...prev.filter((r) => r.id !== repo.id)])
  }

  async function generateReport(repo: Repo) {
    setGeneratingFor(repo.id)
    setError('')
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_id: repo.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDigests((prev) => [data.digest, ...prev])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate report')
    } finally {
      setGeneratingFor(null)
    }
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
      {/* Top bar */}
      <div className="glass-header" style={{ borderBottom: '1px solid var(--border)', borderRadius: 0, flexShrink: 0 }}>
        <div className="flex items-center gap-2">
          <span style={{ fontWeight: 600, fontSize: 13 }}>Dashboard</span>
          <span style={{ color: 'var(--tm)', fontSize: 11 }}>— {githubLogin}</span>
        </div>
        <button className="glass-btn glass-btn-primary" style={{ fontSize: 11 }} onClick={() => setShowModal(true)}>
          + Connect Repo
        </button>
      </div>

      {/* Global stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderBottom: '1px solid var(--b1)',
          flexShrink: 0,
        }}
      >
        {[
          { label: 'Connected Repos', value: repos.length },
          { label: 'Total Digests', value: totalDigests },
          { label: 'Global Avg Cycle', value: formatHours(globalAvgCycle) },
        ].map((s, i) => (
          <div
            key={s.label}
            className="stat-card"
            style={{ borderRight: i < 2 ? '1px solid var(--b1)' : 'none', textAlign: 'center' }}
          >
            <div style={{ fontSize: 26, fontWeight: 300, color: 'var(--tp)' }}>{s.value}</div>
            <div style={{ fontSize: 9, color: 'var(--tm)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ padding: '8px 16px', background: 'rgba(252,165,165,0.07)', borderBottom: '1px solid var(--b1)', fontSize: 11, color: 'var(--failed)', flexShrink: 0 }}>
          {error}
        </div>
      )}

      {/* Repo list */}
      <div className="flex-1 overflow-y-auto">
        {repos.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 300,
              gap: 14,
              color: 'var(--tm)',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 300, letterSpacing: '0.04em' }}>No repos connected</div>
            <button className="glass-btn glass-btn-primary" onClick={() => setShowModal(true)}>
              + Connect your first repo
            </button>
          </div>
        ) : (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {repos.map((repo) => {
              const latest = latestDigestFor(repo.id)
              const isGenerating = generatingFor === repo.id
              return (
                <div key={repo.id} className="glass-panel">
                  <div className="glass-header">
                    <div className="flex items-center gap-3 min-w-0">
                      <Link
                        href={`/repos/${repo.id}`}
                        style={{ color: 'var(--tp)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}
                      >
                        {repo.full_name}
                      </Link>
                      {latest && latest.failed_job_names.length > 0 && (
                        <span className="chip chip-failed">CI Fail</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        className="glass-btn glass-btn-primary"
                        style={{ fontSize: 10, padding: '3px 10px' }}
                        disabled={isGenerating}
                        onClick={() => generateReport(repo)}
                      >
                        {isGenerating ? 'Generating…' : '+ Report'}
                      </button>
                      <Link href={`/repos/${repo.id}`}>
                        <button className="glass-btn" style={{ fontSize: 10, padding: '3px 10px' }}>View</button>
                      </Link>
                    </div>
                  </div>

                  {latest ? (
                    <div style={{ padding: '10px 14px' }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        {[
                          { label: 'Merged', value: latest.merged_count, color: latest.merged_count > 0 ? 'var(--merged)' : 'var(--tm)' },
                          { label: 'Open',   value: latest.open_count,   color: 'var(--tm)' },
                          { label: 'Cycle',  value: formatHours(latest.avg_cycle_time_hours), color: 'var(--tp)' },
                          { label: 'Stale',  value: latest.stale_pr_count, color: latest.stale_pr_count > 0 ? 'var(--stale)' : 'var(--tm)' },
                        ].map((s) => (
                          <div
                            key={s.label}
                            style={{
                              background: 'var(--glass-lo)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '8px 10px',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontSize: 16, fontWeight: 300, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: 9, color: 'var(--tm)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--tm)', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {latest.summary}
                      </p>
                      <div style={{ marginTop: 6, fontSize: 10, color: 'var(--td)' }}>
                        Last digest: {formatDate(latest.created_at)}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '14px', fontSize: 11, color: 'var(--tm)' }}>
                      No digests yet — click "+ Report" to generate the first one.
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <ConnectRepoModal
          onClose={() => setShowModal(false)}
          onConnected={(repo) => {
            handleConnected(repo)
            setShowModal(false)
          }}
          connectedIds={repos.map((r) => r.github_repo_id)}
        />
      )}
    </main>
  )
}
