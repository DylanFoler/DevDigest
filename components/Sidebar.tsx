'use client'

import Link from 'next/link'

interface NavNode { label: string; href: string; key: string; icon: string }

const NAV: NavNode[] = [
  { label: 'Dashboard', href: '/dashboard', key: 'dashboard', icon: '⊞' },
  { label: 'Repos',     href: '/dashboard', key: 'repos',     icon: '◫' },
  { label: 'Settings',  href: '/settings',  key: 'settings',  icon: '◈' },
]

interface Props { active: string; githubLogin?: string }

export default function Sidebar({ active, githubLogin }: Props) {
  const W = 52
  const nodeY = [68, 140, 212]

  return (
    <aside
      className="flex flex-col flex-shrink-0 h-screen"
      style={{
        width: 196,
        background: 'var(--win-bg)',
        borderRight: '2px solid',
        borderColor: 'var(--win-lo)',
        boxShadow: 'inset -1px 0 0 var(--win-dark)',
      }}
    >
      {/* Title bar */}
      <div className="glass-header" style={{ borderRadius: 0 }}>
        <span>DevDigest</span>
        <div className="ctrl-btns">
          <span className="ctrl-btn">_</span>
          <span className="ctrl-btn">□</span>
        </div>
      </div>

      {/* Molecule SVG nav */}
      <div className="relative flex-1 flex flex-col">
        <svg width={W} height={270} viewBox={`0 0 ${W} 270`} className="absolute left-0 top-0" style={{ zIndex: 0 }}>
          {nodeY.slice(0, -1).map((y, i) => (
            <line key={i} x1={W/2} y1={y} x2={W/2} y2={nodeY[i+1]}
              stroke="#808080" strokeWidth={1} strokeDasharray="3 4" />
          ))}
          {NAV.map((node, i) => {
            const isActive = node.key === active
            return (
              <g key={node.key}>
                {isActive && (
                  <circle cx={W/2} cy={nodeY[i]} r={16}
                    fill="none" stroke="#000080" strokeWidth={1} className="animate-pulse2" />
                )}
                <circle
                  cx={W/2} cy={nodeY[i]}
                  r={isActive ? 11 : 8}
                  fill={isActive ? '#000080' : '#c0c0c0'}
                  stroke={isActive ? '#000080' : '#808080'}
                  strokeWidth={isActive ? 2 : 1}
                />
                <text x={W/2} y={nodeY[i]+4} textAnchor="middle"
                  fontSize={isActive ? 11 : 10}
                  fill={isActive ? '#ffffff' : '#444444'}
                  fontFamily="VT323, monospace">
                  {node.icon}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Nav labels */}
        <nav className="flex flex-col pt-4" style={{ paddingLeft: W + 4 }}>
          {NAV.map((node) => {
            const isActive = node.key === active
            return (
              <Link key={node.key} href={node.href} style={{
                height: 72,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 8,
                fontSize: 14,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontFamily: "'VT323', monospace",
                fontWeight: isActive ? 'bold' : 'normal',
                color: isActive ? '#ffffff' : 'var(--tm)',
                textDecoration: 'none',
                background: isActive ? '#000080' : 'transparent',
                borderLeft: isActive ? '3px solid #1084d0' : '3px solid transparent',
              }}>
                {node.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User info — Win95 status bar style */}
      <div style={{
        borderTop: '2px solid',
        borderColor: 'var(--win-lo) var(--win-hi) var(--win-hi) var(--win-lo)',
        padding: '5px 10px',
        fontSize: 12,
        fontFamily: "'VT323', monospace",
        background: 'var(--win-bg)',
      }}>
        <div style={{ fontSize: 10, color: 'var(--td)', textTransform: 'uppercase', marginBottom: 2 }}>
          Signed in as
        </div>
        <div style={{ color: '#000080', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {githubLogin ?? '--'}
        </div>
      </div>
    </aside>
  )
}
