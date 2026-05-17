'use client'

import Link from 'next/link'

const NAV = [
  { label: 'Dashboard', href: '/dashboard', key: 'dashboard' },
  { label: 'Repos',     href: '/dashboard', key: 'repos'     },
  { label: 'Settings',  href: '/settings',  key: 'settings'  },
]

interface Props { active: string; githubLogin?: string }

export default function Sidebar({ active, githubLogin }: Props) {
  return (
    <aside
      className="flex flex-col flex-shrink-0 h-screen"
      style={{
        width: 196,
        background: 'var(--panel-lo)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Title */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'var(--panel-lo)',
      }}>
        <div style={{
          fontFamily: "'Share Tech Mono', 'Courier New', monospace",
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
        }}>
          DevDigest
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col flex-1 pt-2">
        {NAV.map((node) => {
          const isActive = node.key === active
          return (
            <Link
              key={node.key}
              href={node.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: 44,
                paddingLeft: 18,
                fontSize: 12,
                fontFamily: "'Share Tech Mono', 'Courier New', monospace",
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: isActive ? 'var(--tp)' : 'var(--tm)',
                textDecoration: 'none',
                background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'color 0.12s',
              }}
            >
              {node.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '10px 16px',
      }}>
        <div style={{ fontSize: 9, color: 'var(--td)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 3 }}>
          Signed in as
        </div>
        <div style={{
          fontSize: 12,
          color: 'var(--accent)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: "'Share Tech Mono', 'Courier New', monospace",
        }}>
          {githubLogin ?? '--'}
        </div>
      </div>
    </aside>
  )
}
