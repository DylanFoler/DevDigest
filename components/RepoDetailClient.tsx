'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Repo, Digest } from '@/types'
import ReportCard from './ReportCard'
import { formatHours } from '@/lib/utils'

interface Props {
  repo: Repo
  initialDigests: Digest[]
}

export default function RepoDetailClient({ repo, initialDigests }: Props) {
  const [digests, setDigests] = useState<Digest[]>(initialDigests)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const totalMerged = digests.reduce((s, d) => s + d.merged_count, 0)
  const totalOpen = digests[0]?.open_count ?? 0
  const avgCycleAll = (() => {
    const vals = digests.map((d) => d.avg_cycle_time_hours).filter((h): h is number => h !== null)
    if (!vals.length) return null
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
  })()
  const totalCIFails = digests.reduce((s, d) => s + d.failed_job_names.length, 0)

  async function generateReport() {
    setGenerating(true)
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
      setGenerating(false)
    }
  }

  function handleDeleteDigest(id: string) {
    setDigests((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
      {/* Top bar */}
      <div
        className="glass-header"
        style={{ borderBottom: '1px solid var(--border)', borderRadius: 0, flexShrink: 0 }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard" style={{ color: 'var(--tm)', fontSize: 11, textDecoration: 'none' }}>
            ← Dashboard
          </Link>
          <span style={{ color: 'var(--border-hi)' }}>|</span>
          <span
            style={{
              fontWeight: 500,
              fontSize: 13,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {repo.full_name}
          </span>
        </div>
        <button
          className="glass-btn glass-btn-primary"
          style={{ fontSize: 11, flexShrink: 0 }}
          disabled={generating}
          onClick={generateReport}
        >
          {generating ? 'Generating…' : '+ New Report'}
        </button>
      </div>

      {/* Stat bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          borderBottom: '1px solid var(--b1)',
          flexShrink: 0,
        }}
      >
        {[
          { label: 'Total Merged',   value: totalMerged,             color: totalMerged > 0 ? 'var(--merged)' : 'var(--tm)' },
          { label: 'Currently Open', value: totalOpen,               color: 'var(--tm)' },
          { label: 'Avg Cycle Time', value: formatHours(avgCycleAll), color: 'var(--tp)' },
          { label: 'CI Failures',    value: totalCIFails,            color: totalCIFails > 0 ? 'var(--failed)' : 'var(--tm)' },
        ].map((s, i) => (
          <div
            key={s.label}
            className="stat-card"
            style={{ borderRight: i < 3 ? '1px solid var(--b1)' : 'none', textAlign: 'center' }}
          >
            <div style={{ fontSize: 26, fontWeight: 300, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 9, color: 'var(--tm)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div
          style={{
            padding: '8px 16px',
            background: 'rgba(252,165,165,0.07)',
            borderBottom: '1px solid var(--b1)',
            fontSize: 11,
            color: 'var(--failed)',
            flexShrink: 0,
          }}
        >
          {error}
        </div>
      )}

      {/* Digests */}
      <div className="flex-1 overflow-y-auto" style={{ padding: 16 }}>
        {digests.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 280,
              gap: 14,
              color: 'var(--tm)',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 300 }}>No digests yet</div>
            <button
              className="glass-btn glass-btn-primary"
              disabled={generating}
              onClick={generateReport}
            >
              {generating ? 'Generating…' : '+ Generate First Report'}
            </button>
          </div>
        ) : (
          digests.map((digest) => (
            <ReportCard key={digest.id} digest={digest} repo={repo} onDelete={handleDeleteDigest} />
          ))
        )}
      </div>
    </main>
  )
}
