'use client'

import { signIn } from 'next-auth/react'
import GeometricBackground from './GeometricBackground'

const FEATURES = [
  'AI-generated PR summaries via Claude',
  'CI/CD failure tracking and job names',
  'Velocity metrics and contributor stats',
]

export default function LoginPage() {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      <GeometricBackground />

      <div className="relative z-10 w-full max-w-[340px] mx-4">
        <div className="glass-panel">
          <div className="glass-header">
            <span style={{ color: 'var(--accent)', letterSpacing: '0.12em' }}>DevDigest</span>
            <span style={{ fontSize: 9, color: 'var(--td)' }}>v1.0</span>
          </div>

          <div className="pixel-grid" style={{ padding: '28px 24px' }}>
            {/* Title block */}
            <div style={{ marginBottom: 22 }}>
              <div style={{
                fontSize: 11,
                color: 'var(--accent)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}>
                PR Intelligence Platform
              </div>
              <div style={{
                fontSize: 11,
                color: 'var(--tm)',
                lineHeight: 1.6,
              }}>
                Track pull request activity, generate AI summaries, and surface
                CI failures across your GitHub repos.
              </div>
            </div>

            <div className="divider" style={{ marginBottom: 20 }} />

            {/* Features */}
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {FEATURES.map((f) => (
                <li key={f} style={{
                  fontSize: 12,
                  color: 'var(--tm)',
                  display: 'flex',
                  gap: 10,
                  lineHeight: 1.45,
                }}>
                  <span style={{ color: 'var(--accent)', flexShrink: 0 }}>+</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
              className="glass-btn glass-btn-primary w-full"
              style={{ fontSize: 12, padding: '9px 14px', letterSpacing: '0.08em' }}
            >
              Connect GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
