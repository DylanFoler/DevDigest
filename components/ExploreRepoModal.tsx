'use client'

import { useState } from 'react'
import type { GitHubRepo, Repo, Digest } from '@/types'

interface Props {
  onClose: () => void
  onReported: (repo: Repo, digest: Digest) => void
  connectedIds: string[]
}

export default function ExploreRepoModal({ onClose, onReported, connectedIds }: Props) {
  const [username, setUsername] = useState('')
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState<number | null>(null)
  const [error, setError] = useState('')

  async function search() {
    if (!username.trim()) return
    setLoading(true)
    setError('')
    setRepos([])
    setSearched(false)
    try {
      const res = await fetch(`/api/github/user-repos?username=${encodeURIComponent(username.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRepos(data.repos ?? [])
      setSearched(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to search')
    } finally {
      setLoading(false)
    }
  }

  async function generateReport(repo: GitHubRepo) {
    setGenerating(repo.id)
    setError('')
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: repo.owner.login, repo: repo.name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onReported(data.repo, data.digest)
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate report')
      setGenerating(null)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-panel flex flex-col" style={{ width: 480, maxHeight: '80vh' }}>
        {/* Header */}
        <div className="glass-header">
          <span>Explore Public Repos</span>
          <div className="ctrl-btns">
            <span className="ctrl-btn" />
            <span className="ctrl-btn" />
            <button
              className="ctrl-btn"
              onClick={onClose}
              style={{ cursor: 'pointer', fontSize: 8 }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Username search */}
        <div
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            gap: 8,
          }}
        >
          <input
            className="glass-input"
            style={{ flex: 1 }}
            placeholder="GitHub username…"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            autoFocus
          />
          <button
            className="glass-btn glass-btn-primary"
            style={{ fontSize: 11, padding: '4px 14px', flexShrink: 0 }}
            disabled={loading || !username.trim()}
            onClick={search}
          >
            {loading ? '…' : 'Search'}
          </button>
        </div>

        {/* Repo list */}
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
          {error && (
            <div style={{ padding: '10px 14px', color: 'var(--failed)', fontSize: 12 }}>{error}</div>
          )}

          {!loading && searched && repos.length === 0 && !error && (
            <div className="p-6 text-center" style={{ color: 'var(--tm)', fontSize: 12 }}>
              No public repositories found
            </div>
          )}

          {!searched && !loading && !error && (
            <div className="p-6 text-center" style={{ color: 'var(--td)', fontSize: 11 }}>
              Enter a GitHub username to explore their public repos
            </div>
          )}

          {repos.map((repo) => {
            const alreadyConnected = connectedIds.includes(String(repo.id))
            const isGenerating = generating === repo.id
            return (
              <div
                key={repo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 14px',
                  borderBottom: '1px solid var(--border)',
                  gap: 12,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--tp)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {repo.full_name}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--tm)', marginTop: 2 }}>
                    {repo.description ? repo.description.slice(0, 60) : 'No description'}
                  </div>
                </div>

                {alreadyConnected ? (
                  <span className="chip chip-muted">connected</span>
                ) : (
                  <button
                    className="glass-btn glass-btn-primary"
                    style={{ fontSize: 10, padding: '4px 12px', flexShrink: 0 }}
                    disabled={isGenerating}
                    onClick={() => generateReport(repo)}
                  >
                    {isGenerating ? 'Generating…' : '+ Report'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '8px 14px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.12)',
          }}
        >
          <span style={{ fontSize: 10, color: 'var(--tm)' }}>
            {searched ? `${repos.length} public repo${repos.length !== 1 ? 's' : ''}` : 'Public repos only'}
          </span>
          <button className="glass-btn" style={{ fontSize: 11 }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
