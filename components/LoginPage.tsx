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

      <div className="relative z-10 w-full max-w-[320px] mx-4">
        <div className="glass-panel">
          {/* Title bar */}
          <div className="glass-header">
            <div className="flex items-center gap-2">
              <span>DevDigest</span>
            </div>
            <div className="ctrl-btns">
              <span className="ctrl-btn">_</span>
              <span className="ctrl-btn">□</span>
              <span className="ctrl-btn">×</span>
            </div>
          </div>

          {/* Content */}
          <div className="pixel-grid" style={{ padding: '20px 18px' }}>
            {/* App name */}
            <div className="flex flex-col items-center mb-5">
              <div style={{ fontSize: 42, marginBottom: 2 }}>🖥️</div>
              <h1
                style={{
                  fontFamily: "'VT323', monospace",
                  fontSize: 26,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--tp)',
                }}
              >
                DevDigest
              </h1>
              <p style={{ fontSize: 12, color: 'var(--td)', letterSpacing: '0.08em', marginTop: 1 }}>
                PR Intelligence v1.0
              </p>
            </div>

            {/* Divider */}
            <div className="divider mb-4" />

            {/* Features */}
            <ul className="mb-5" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {FEATURES.map((f) => (
                <li
                  key={f}
                  style={{ fontSize: 13, color: 'var(--tm)', display: 'flex', gap: 6, fontFamily: "'VT323', monospace" }}
                >
                  <span style={{ color: 'var(--tp)', flexShrink: 0 }}>▸</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
                className="glass-btn glass-btn-primary"
                style={{ fontSize: 14, padding: '6px 24px', letterSpacing: '0.06em' }}
              >
                Connect GitHub
              </button>
            </div>
          </div>

          {/* Status bar */}
          <div
            style={{
              borderTop: '2px solid',
              borderColor: 'var(--win-lo) var(--win-hi) var(--win-hi) var(--win-lo)',
              padding: '3px 8px',
              fontSize: 11,
              color: 'var(--td)',
              background: 'var(--win-bg)',
              fontFamily: "'VT323', monospace",
              letterSpacing: '0.04em',
            }}
          >
            Requires GitHub OAuth — repo scope
          </div>
        </div>
      </div>
    </div>
  )
}
