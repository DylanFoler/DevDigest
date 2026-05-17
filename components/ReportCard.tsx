'use client'

import { useState } from 'react'
import type { Digest, Repo, ContributorStat } from '@/types'
import { formatDate, formatDateShort, formatHours, getContributorStats } from '@/lib/utils'

interface Props {
  digest: Digest
  repo: Repo
  onDelete: (id: string) => void
}

export default function ReportCard({ digest, repo, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const prs = digest.raw_data?.prs ?? []
  const keyChanges = digest.raw_data?.key_changes ?? []
  const contributors: ContributorStat[] = getContributorStats(prs)
  const stalePRs = prs.filter((p) => p.is_stale)
  const dist = digest.pr_size_distribution ?? { xs: 0, s: 0, m: 0, l: 0 }
  const totalDist = (dist.xs + dist.s + dist.m + dist.l) || 1
  const hasFailed = digest.failed_job_names.length > 0

  async function handleDelete() {
    if (!confirm('Delete this digest?')) return
    setDeleting(true)
    try {
      await fetch(`/api/digests/${digest.id}`, { method: 'DELETE' })
      onDelete(digest.id)
    } finally {
      setDeleting(false)
    }
  }

  async function handleExportPDF() {
    setExporting(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210
      let y = 0

      doc.setFillColor(10, 10, 10)
      doc.rect(0, 0, W, 32, 'F')
      doc.setTextColor(230, 230, 230)
      doc.setFontSize(15)
      doc.setFont('courier', 'bold')
      doc.text(repo.full_name, 14, 14)
      doc.setFontSize(8)
      doc.setFont('courier', 'normal')
      doc.setTextColor(210, 210, 210)
      doc.text(`${formatDate(digest.period_start)} — ${formatDate(digest.period_end)}`, 14, 21)
      doc.text(`Generated: ${formatDate(digest.created_at)}`, 14, 27)
      y = 40

      doc.setDrawColor(60, 60, 60)
      doc.setFillColor(20, 20, 20)
      doc.rect(14, y, W - 28, 18, 'FD')
      const stats = [
        { label: 'PRs',       value: String(digest.pr_count) },
        { label: 'Merged',    value: String(digest.merged_count) },
        { label: 'Open',      value: String(digest.open_count) },
        { label: 'Avg Cycle', value: formatHours(digest.avg_cycle_time_hours) },
        { label: 'Stale',     value: String(digest.stale_pr_count) },
      ]
      stats.forEach((s, i) => {
        const x = 14 + i * 36 + 4
        doc.setFontSize(14); doc.setFont('courier', 'bold'); doc.setTextColor(220, 220, 220)
        doc.text(s.value, x, y + 9)
        doc.setFontSize(7); doc.setFont('courier', 'normal'); doc.setTextColor(248, 248, 248)
        doc.text(s.label, x, y + 15)
      })
      y += 26

      if (hasFailed) {
        doc.setFontSize(8); doc.setTextColor(248, 113, 113)
        doc.text('FAILED CI: ' + digest.failed_job_names.join(', '), 14, y)
        y += 8
      }

      doc.setDrawColor(60, 60, 60); doc.line(14, y, W - 14, y); y += 6
      doc.setFontSize(9); doc.setFont('courier', 'bold'); doc.setTextColor(248, 248, 248)
      doc.text('SUMMARY', 14, y); y += 5
      doc.setFont('courier', 'normal'); doc.setFontSize(8); doc.setTextColor(238, 238, 238)
      const summaryLines = doc.splitTextToSize(digest.summary ?? '', W - 28)
      doc.text(summaryLines, 14, y); y += summaryLines.length * 4 + 6

      if (keyChanges.length > 0) {
        doc.line(14, y, W - 14, y); y += 6
        doc.setFont('courier', 'bold'); doc.setFontSize(9); doc.setTextColor(248, 248, 248)
        doc.text('KEY CHANGES', 14, y); y += 5
        doc.setFont('courier', 'normal'); doc.setFontSize(8); doc.setTextColor(238, 238, 238)
        for (const kc of keyChanges) {
          const lines = doc.splitTextToSize(`+ ${kc}`, W - 30)
          doc.text(lines, 16, y); y += lines.length * 4 + 2
        }
        y += 4
      }

      doc.line(14, y, W - 14, y); y += 6
      doc.setFont('courier', 'bold'); doc.setFontSize(9); doc.setTextColor(248, 248, 248)
      doc.text('PULL REQUESTS', 14, y); y += 5

      for (const pr of prs.slice(0, 20)) {
        if (y > 265) { doc.addPage(); y = 20 }
        const sc = pr.merged ? [134, 239, 172] : pr.is_stale ? [253, 186, 116] : [140, 140, 140]
        doc.setTextColor(sc[0], sc[1], sc[2]); doc.setFont('courier', 'bold'); doc.setFontSize(7)
        doc.text(`[${pr.merged ? 'MERGED' : pr.state.toUpperCase()}]`, 14, y)
        doc.setTextColor(180, 180, 180); doc.setFont('courier', 'normal')
        const title = doc.splitTextToSize(`#${pr.number} ${pr.title} (${pr.author})`, W - 52)
        doc.text(title, 42, y)
        doc.setTextColor(195, 195, 195); doc.text(`${pr.size} +${pr.additions}/-${pr.deletions}`, W - 28, y)
        y += title.length * 3.5 + 2
      }

      if (contributors.length > 0) {
        if (y > 240) { doc.addPage(); y = 20 }
        y += 4; doc.line(14, y, W - 14, y); y += 6
        doc.setFont('courier', 'bold'); doc.setFontSize(9); doc.setTextColor(248, 248, 248)
        doc.text('CONTRIBUTORS', 14, y); y += 5
        doc.setFontSize(7); doc.setTextColor(248, 248, 248)
        doc.text('Author', 14, y); doc.text('PRs', 80, y); doc.text('Merged', 100, y); doc.text('Rate', 130, y)
        y += 4; doc.setTextColor(238, 238, 238)
        for (const c of contributors.slice(0, 10)) {
          doc.text(c.author.slice(0, 24), 14, y); doc.text(String(c.prs), 80, y)
          doc.text(String(c.merged), 100, y); doc.text(`${c.rate}%`, 130, y)
          y += 4
        }
      }

      if (digest.release_notes) {
        if (y > 240) { doc.addPage(); y = 20 }
        y += 4; doc.line(14, y, W - 14, y); y += 6
        doc.setFont('courier', 'bold'); doc.setFontSize(9); doc.setTextColor(248, 248, 248)
        doc.text('RELEASE NOTES', 14, y); y += 5
        doc.setFont('courier', 'normal'); doc.setFontSize(8); doc.setTextColor(235, 235, 235)
        const rnLines = doc.splitTextToSize(digest.release_notes, W - 28)
        doc.text(rnLines, 14, y)
      }

      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i); doc.setFontSize(7); doc.setTextColor(70, 70, 70)
        doc.text(`DevDigest — ${repo.full_name}`, 14, 292)
        doc.text(`Page ${i} of ${pageCount}`, W - 30, 292)
      }

      doc.save(`${repo.name}-digest-${formatDateShort(digest.created_at).replace(' ', '-')}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="glass-panel" style={{ marginBottom: 12 }}>
      {/* Header */}
      <div className="glass-header">
        <div className="flex items-center gap-3 min-w-0">
          <span style={{ fontSize: 13, fontWeight: 500 }}>{repo.full_name}</span>
          <span style={{ color: 'var(--tm)', fontSize: 11 }}>
            {formatDateShort(digest.period_start)} — {formatDateShort(digest.period_end)}
          </span>
          {hasFailed && <span className="chip chip-failed">CI Fail</span>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            className="glass-btn"
            style={{ fontSize: 10, padding: '3px 10px' }}
            title="Export PDF"
            disabled={exporting}
            onClick={handleExportPDF}
          >
            {exporting ? '…' : 'PDF'}
          </button>
          <button
            className="glass-btn"
            style={{ fontSize: 10, padding: '3px 10px' }}
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? '▲' : '▼'}
          </button>
          <button
            className="glass-btn glass-btn-danger"
            style={{ fontSize: 10, padding: '3px 10px' }}
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? '…' : 'Del'}
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {[
          { label: 'Merged',     value: digest.merged_count,                             color: digest.merged_count > 0 ? 'var(--merged)' : 'var(--tm)' },
          { label: 'Open',       value: digest.open_count,                               color: 'var(--tm)' },
          { label: 'CI Runs',    value: (digest.raw_data?.workflow_runs ?? []).length,   color: hasFailed ? 'var(--failed)' : 'var(--tm)' },
          { label: 'Avg Cycle',  value: formatHours(digest.avg_cycle_time_hours),        color: 'var(--tp)' },
          { label: 'Avg Review', value: formatHours(digest.avg_review_time_hours),       color: 'var(--tp)' },
        ].map((s, i) => (
          <div
            key={s.label}
            className="stat-card"
            style={{ borderRight: i < 4 ? '1px solid var(--border)' : 'none', textAlign: 'center' }}
          >
            <div style={{ fontSize: 18, fontWeight: 300, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* PR size distribution */}
      <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>
          PR Size Distribution
        </div>
        <div
          style={{
            display: 'flex',
            height: 6,
            width: '100%',
            overflow: 'hidden',
            borderRadius: 3,
            background: 'var(--glass-lo)',
          }}
        >
          {(
            [
              { key: 'xs', color: 'rgba(255,255,255,0.12)' },
              { key: 's',  color: 'rgba(255,255,255,0.24)' },
              { key: 'm',  color: 'rgba(255,255,255,0.42)' },
              { key: 'l',  color: 'rgba(255,255,255,0.65)' },
            ] as const
          ).map((seg) => {
            const count = dist[seg.key]
            const pct = (count / totalDist) * 100
            if (pct === 0) return null
            return (
              <div
                key={seg.key}
                title={`${seg.key.toUpperCase()}: ${count}`}
                style={{ width: `${pct}%`, background: seg.color }}
              />
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          {(['xs', 's', 'm', 'l'] as const).map((k) => (
            <span key={k} style={{ fontSize: 9, color: 'var(--tm)' }}>
              {k.toUpperCase()}: {dist[k]}
            </span>
          ))}
        </div>
      </div>

      {/* Failed jobs */}
      {hasFailed && (
        <div
          style={{
            padding: '7px 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          {digest.failed_job_names.map((job) => (
            <span key={job} className="chip chip-failed">{job}</span>
          ))}
        </div>
      )}

      {/* AI Summary */}
      <div style={{ padding: '12px 14px', borderBottom: expanded ? '1px solid var(--border)' : 'none' }}>
        <div
          style={{
            fontSize: 9,
            color: 'var(--tm)',
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            marginBottom: 7,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ opacity: 0.5 }}>✦</span> AI Summary
        </div>
        <p style={{ fontSize: 12, color: 'var(--tp)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
          {digest.summary ?? 'No summary generated.'}
        </p>
      </div>

      {/* Expanded */}
      {expanded && (
        <>
          {/* PR list */}
          <div style={{ borderBottom: '1px solid var(--border)' }}>
            <div
              style={{
                padding: '7px 14px 0',
                fontSize: 9,
                color: 'var(--tm)',
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
              }}
            >
              Pull Requests ({prs.length})
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {prs.map((pr) => (
                <div
                  key={pr.number}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 14px',
                    borderTop: '1px solid var(--border)',
                    fontSize: 11,
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: 10,
                      color: pr.merged ? 'var(--merged)' : pr.is_stale ? 'var(--stale)' : 'var(--tm)',
                    }}
                  >
                    {pr.merged ? '●' : pr.is_stale ? '◌' : '○'}
                  </span>
                  <span style={{ color: 'var(--tm)', flexShrink: 0, fontSize: 10 }}>#{pr.number}</span>
                  <span
                    style={{
                      color: 'var(--tp)',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {pr.title}
                  </span>
                  <span style={{ color: 'var(--tm)', flexShrink: 0, fontSize: 10 }}>{pr.author}</span>
                  <span className={`chip chip-${pr.merged ? 'merged' : pr.is_stale ? 'stale' : 'muted'}`} style={{ fontSize: 9 }}>
                    {pr.size}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Key changes */}
          {keyChanges.length > 0 && (
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
              <div
                style={{
                  fontSize: 9,
                  color: 'var(--tm)',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  marginBottom: 7,
                }}
              >
                Key Changes
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {keyChanges.map((kc, i) => (
                  <li key={i} style={{ fontSize: 12, color: 'var(--tp)', display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--tm)', flexShrink: 0 }}>—</span>
                    <span>{kc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contributors */}
          {contributors.length > 0 && (
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
              <div
                style={{
                  fontSize: 9,
                  color: 'var(--tm)',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  marginBottom: 7,
                }}
              >
                Contributors
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr
                    style={{
                      color: 'var(--tm)',
                      fontSize: 9,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    <th style={{ textAlign: 'left', padding: '3px 0', fontWeight: 400 }}>Author</th>
                    <th style={{ textAlign: 'right', padding: '3px 8px', fontWeight: 400 }}>PRs</th>
                    <th style={{ textAlign: 'right', padding: '3px 8px', fontWeight: 400 }}>Merged</th>
                    <th style={{ textAlign: 'right', padding: '3px 0', fontWeight: 400 }}>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {contributors.map((c) => (
                    <tr key={c.author} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '5px 0', color: 'var(--tp)' }}>{c.author}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--tm)' }}>{c.prs}</td>
                      <td
                        style={{
                          padding: '5px 8px',
                          textAlign: 'right',
                          color: c.merged > 0 ? 'var(--merged)' : 'var(--tm)',
                        }}
                      >
                        {c.merged}
                      </td>
                      <td style={{ padding: '5px 0', textAlign: 'right', color: 'var(--tm)' }}>{c.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Stale PRs */}
          {stalePRs.length > 0 && (
            <div
              style={{
                padding: '9px 14px',
                borderBottom: '1px solid var(--border)',
                background: 'rgba(253,186,116,0.04)',
                borderLeft: '2px solid var(--stale)',
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: 'var(--stale)',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  marginBottom: 5,
                }}
              >
                Stale PRs ({stalePRs.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {stalePRs.map((pr) => (
                  <span key={pr.number} className="chip chip-stale">
                    #{pr.number} {pr.title.slice(0, 28)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Release notes */}
          {digest.release_notes && (
            <div style={{ padding: '10px 14px' }}>
              <div
                style={{
                  fontSize: 9,
                  color: 'var(--tm)',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  marginBottom: 7,
                }}
              >
                Release Notes
              </div>
              <pre
                style={{
                  fontFamily: '"Courier New", monospace',
                  fontSize: 11,
                  color: 'var(--tp)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.7,
                  background: 'rgba(0,0,0,0.28)',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  overflowX: 'auto',
                }}
              >
                {digest.release_notes}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  )
}
