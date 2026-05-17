'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import type { Repo } from '@/types'
import { formatDate } from '@/lib/utils'

interface Props {
  repos: Repo[]
  githubLogin: string
  email: string | null
}

export default function SettingsClient({ repos: initialRepos, githubLogin, email }: Props) {
  const [repos, setRepos] = useState<Repo[]>(initialRepos)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function disconnect(repoId: string) {
    if (!confirm('Disconnect this repo? All its digests will be deleted.')) return
    setDisconnecting(repoId)
    setError('')
    try {
      const res = await fetch(`/api/repos/${repoId}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      setRepos((prev) => prev.filter((r) => r.id !== repoId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to disconnect')
    } finally {
      setDisconnecting(null)
    }
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
      {/* Top bar */}
      <div
        className="glass-header"
        style={{ borderBottom: '1px solid var(--border)', borderRadius: 0, flexShrink: 0 }}
      >
        <span style={{ fontWeight: 600, fontSize: 13 }}>Settings</span>
        <button
          className="glass-btn glass-btn-danger"
          style={{ fontSize: 11 }}
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          Sign Out
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {/* Account */}
        <div className="glass-panel">
          <div className="glass-header">
            <span>Account</span>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
              <span style={{ color: 'var(--tm)', width: 80, flexShrink: 0 }}>GitHub</span>
              <span style={{ color: 'var(--tp)', fontWeight: 500 }}>{githubLogin}</span>
            </div>
            {email && (
              <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                <span style={{ color: 'var(--tm)', width: 80, flexShrink: 0 }}>Email</span>
                <span style={{ color: 'var(--tp)' }}>{email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Connected repos */}
        <div className="glass-panel">
          <div className="glass-header">
            <span>Connected Repositories ({repos.length})</span>
          </div>

          {error && (
            <div
              style={{
                padding: '8px 14px',
                background: 'rgba(252,165,165,0.07)',
                borderBottom: '1px solid var(--border)',
                fontSize: 11,
                color: 'var(--failed)',
              }}
            >
              {error}
            </div>
          )}

          {repos.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--tm)', fontSize: 12 }}>
              No repositories connected
            </div>
          ) : (
            repos.map((repo, i) => (
              <div
                key={repo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--tp)' }}>{repo.full_name}</div>
                  <div style={{ fontSize: 10, color: 'var(--tm)', marginTop: 2 }}>
                    Connected {formatDate(repo.connected_at)}
                  </div>
                </div>
                <button
                  className="glass-btn glass-btn-danger"
                  style={{ fontSize: 10, padding: '4px 12px', flexShrink: 0 }}
                  disabled={disconnecting === repo.id}
                  onClick={() => disconnect(repo.id)}
                >
                  {disconnecting === repo.id ? '…' : 'Disconnect'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Danger zone */}
        <div className="glass-panel" style={{ borderColor: 'rgba(252,165,165,0.18)' }}>
          <div className="glass-header" style={{ color: 'var(--failed)' }}>
            <span>Danger Zone</span>
          </div>
          <div style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--tp)' }}>Sign out of DevDigest</div>
                <div style={{ fontSize: 10, color: 'var(--tm)', marginTop: 2 }}>
                  Clears session. Your data is preserved.
                </div>
              </div>
              <button
                className="glass-btn glass-btn-danger"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
