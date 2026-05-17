'use client'

import { useEffect, useState } from 'react'
import type { GitHubRepo, Repo } from '@/types'

interface Props {
  onClose: () => void
  onConnected: (repo: Repo) => void
  connectedIds: string[]
}

export default function ConnectRepoModal({ onClose, onConnected, connectedIds }: Props) {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [connecting, setConnecting] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/github/repos')
      .then((r) => r.json())
      .then((d) => setRepos(d.repos ?? []))
      .catch(() => setError('Failed to load repositories'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = repos.filter((r) =>
    r.full_name.toLowerCase().includes(filter.toLowerCase())
  )

  async function connect(repo: GitHubRepo) {
    setConnecting(repo.id)
    try {
      const res = await fetch('/api/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          github_repo_id: repo.id,
          owner: repo.owner.login,
          name: repo.name,
          full_name: repo.full_name,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onConnected(data.repo)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Connection failed')
    } finally {
      setConnecting(null)
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
          <span>Connect Repository</span>
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

        {/* Search */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
          <input
            className="glass-input"
            placeholder="Filter repositories…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            autoFocus
          />
        </div>

        {/* Repo list */}
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
          {loading && (
            <div className="p-6 text-center" style={{ color: 'var(--tm)', fontSize: 12 }}>
              Loading repositories…
            </div>
          )}

          {error && (
            <div className="p-4" style={{ color: 'var(--failed)', fontSize: 12 }}>{error}</div>
          )}

          {!loading && filtered.length === 0 && !error && (
            <div className="p-6 text-center" style={{ color: 'var(--tm)', fontSize: 12 }}>
              No repositories found
            </div>
          )}

          {filtered.map((repo) => {
            const alreadyConnected = connectedIds.includes(String(repo.id))
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
                  transition: 'background 0.1s',
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
                    {repo.private ? 'private' : 'public'}
                    {repo.description ? ` — ${repo.description.slice(0, 60)}` : ''}
                  </div>
                </div>

                {alreadyConnected ? (
                  <span className="chip chip-muted">connected</span>
                ) : (
                  <button
                    className="glass-btn glass-btn-primary"
                    style={{ fontSize: 10, padding: '4px 12px', flexShrink: 0 }}
                    disabled={connecting === repo.id}
                    onClick={() => connect(repo)}
                  >
                    {connecting === repo.id ? '…' : 'Connect'}
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
            {filtered.length} repo{filtered.length !== 1 ? 's' : ''}
          </span>
          <button className="glass-btn" style={{ fontSize: 11 }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
