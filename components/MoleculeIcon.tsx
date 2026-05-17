interface Props {
  size?: number
  glowIntensity?: 'none' | 'subtle' | 'medium'
  className?: string
}

export default function MoleculeIcon({ size = 24, glowIntensity = 'subtle', className }: Props) {
  const s = size
  // 4 atoms: A(left) - B(hub) - C(top-right) with D(bottom-right) branching from B
  const atoms = [
    { x: s * 0.08, y: s * 0.5 },    // A
    { x: s * 0.42, y: s * 0.5 },    // B (hub)
    { x: s * 0.78, y: s * 0.22 },   // C
    { x: s * 0.78, y: s * 0.78 },   // D
  ]
  const bonds: [number, number][] = [
    [0, 1], // A-B
    [1, 2], // B-C
    [1, 3], // B-D
  ]
  const r = s * 0.09

  const filterClass = glowIntensity === 'medium' ? 'glow-md' : glowIntensity === 'subtle' ? 'glow-sm' : ''

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      fill="none"
      className={[filterClass, className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      {bonds.map(([a, b], i) => (
        <line
          key={i}
          x1={atoms[a].x}
          y1={atoms[a].y}
          x2={atoms[b].x}
          y2={atoms[b].y}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={s * 0.025}
        />
      ))}
      {atoms.map((atom, i) => (
        <circle
          key={i}
          cx={atom.x}
          cy={atom.y}
          r={i === 1 ? r * 1.3 : r}
          fill={i === 1 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)'}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={s * 0.025}
        />
      ))}
    </svg>
  )
}
