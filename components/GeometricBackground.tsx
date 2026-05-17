'use client'

import { useEffect, useRef } from 'react'

interface Vertex { x: number; y: number; z: number }
interface Edge { a: number; b: number }
interface Shape {
  vertices: Vertex[]
  edges: Edge[]
  rx: number; ry: number; rz: number
  drx: number; dry: number; drz: number
  ox: number; oy: number
}

function rotateX(v: Vertex, a: number): Vertex {
  return { x: v.x, y: v.y * Math.cos(a) - v.z * Math.sin(a), z: v.y * Math.sin(a) + v.z * Math.cos(a) }
}
function rotateY(v: Vertex, a: number): Vertex {
  return { x: v.x * Math.cos(a) + v.z * Math.sin(a), y: v.y, z: -v.x * Math.sin(a) + v.z * Math.cos(a) }
}
function rotateZ(v: Vertex, a: number): Vertex {
  return { x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a), z: v.z }
}
function project(v: Vertex, fov: number): [number, number, number] {
  const d = fov / (fov + v.z)
  return [v.x * d, v.y * d, d]
}

function cube(s: number): { vertices: Vertex[]; edges: Edge[] } {
  const h = s / 2
  const vertices: Vertex[] = [
    { x: -h, y: -h, z: -h }, { x: h, y: -h, z: -h }, { x: h, y: h, z: -h }, { x: -h, y: h, z: -h },
    { x: -h, y: -h, z: h },  { x: h, y: -h, z: h },  { x: h, y: h, z: h },  { x: -h, y: h, z: h },
  ]
  const edges: Edge[] = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 3 }, { a: 3, b: 0 },
    { a: 4, b: 5 }, { a: 5, b: 6 }, { a: 6, b: 7 }, { a: 7, b: 4 },
    { a: 0, b: 4 }, { a: 1, b: 5 }, { a: 2, b: 6 }, { a: 3, b: 7 },
  ]
  return { vertices, edges }
}

function octahedron(s: number): { vertices: Vertex[]; edges: Edge[] } {
  const vertices: Vertex[] = [
    { x: 0, y: s, z: 0 }, { x: s, y: 0, z: 0 }, { x: 0, y: 0, z: s },
    { x: -s, y: 0, z: 0 }, { x: 0, y: 0, z: -s }, { x: 0, y: -s, z: 0 },
  ]
  const edges: Edge[] = [
    { a: 0, b: 1 }, { a: 0, b: 2 }, { a: 0, b: 3 }, { a: 0, b: 4 },
    { a: 5, b: 1 }, { a: 5, b: 2 }, { a: 5, b: 3 }, { a: 5, b: 4 },
    { a: 1, b: 2 }, { a: 2, b: 3 }, { a: 3, b: 4 }, { a: 4, b: 1 },
  ]
  return { vertices, edges }
}

function icosahedron(s: number): { vertices: Vertex[]; edges: Edge[] } {
  const t = (1 + Math.sqrt(5)) / 2
  const n = Math.sqrt(1 + t * t)
  const scale = s / n
  const raw = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ]
  const vertices: Vertex[] = raw.map(([x, y, z]) => ({ x: x * scale, y: y * scale, z: z * scale }))
  const edges: Edge[] = [
    { a: 0, b: 1 }, { a: 0, b: 5 }, { a: 0, b: 7 }, { a: 0, b: 10 }, { a: 0, b: 11 },
    { a: 1, b: 5 }, { a: 1, b: 7 }, { a: 1, b: 8 }, { a: 1, b: 9 },
    { a: 2, b: 3 }, { a: 2, b: 4 }, { a: 2, b: 6 }, { a: 2, b: 10 }, { a: 2, b: 11 },
    { a: 3, b: 4 }, { a: 3, b: 6 }, { a: 3, b: 8 }, { a: 3, b: 9 },
    { a: 4, b: 5 }, { a: 4, b: 9 }, { a: 4, b: 11 },
    { a: 5, b: 9 }, { a: 5, b: 11 },
    { a: 6, b: 7 }, { a: 6, b: 8 }, { a: 6, b: 10 },
    { a: 7, b: 8 }, { a: 7, b: 10 },
    { a: 8, b: 9 }, { a: 10, b: 11 },
  ]
  return { vertices, edges }
}

export default function GeometricBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const fov = 380
    const shapes: Shape[] = [
      { ...cube(75), rx: 0, ry: 0, rz: 0, drx: 0.0028, dry: 0.005, drz: 0.002, ox: -0.28, oy: -0.18 },
      { ...icosahedron(52), rx: 1, ry: 0.5, rz: 0, drx: 0.0018, dry: 0.003, drz: 0.0035, ox: 0.3, oy: 0.2 },
      { ...octahedron(62), rx: 0.5, ry: 1, rz: 0.5, drx: 0.004, dry: 0.002, drz: 0.0025, ox: 0.05, oy: -0.32 },
    ]

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const shape of shapes) {
        shape.rx += shape.drx
        shape.ry += shape.dry
        shape.rz += shape.drz

        const cx = canvas.width / 2 + shape.ox * Math.min(canvas.width, 900) * 0.5
        const cy = canvas.height / 2 + shape.oy * Math.min(canvas.height, 700) * 0.5

        const pts = shape.vertices.map((v) => {
          let r = rotateX(v, shape.rx)
          r = rotateY(r, shape.ry)
          r = rotateZ(r, shape.rz)
          const [px, py, d] = project(r, fov)
          return { sx: cx + px, sy: cy + py, d }
        })

        for (const { a, b } of shape.edges) {
          const alpha = Math.max(0.08, Math.min(0.30, 0.14 + (pts[a].d + pts[b].d) * 0.02))
          ctx.beginPath()
          ctx.strokeStyle = `rgba(255,255,255,${alpha})`
          ctx.lineWidth = 0.8
          ctx.moveTo(pts[a].sx, pts[a].sy)
          ctx.lineTo(pts[b].sx, pts[b].sy)
          ctx.stroke()
        }

        for (const pt of pts) {
          const alpha = Math.max(0.10, Math.min(0.35, pt.d * 0.18))
          ctx.beginPath()
          ctx.arc(pt.sx, pt.sy, 2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,255,255,${alpha})`
          ctx.fill()
        }
      }

      // Connect nearby vertices across shapes
      const allPts: { x: number; y: number }[] = []
      for (const shape of shapes) {
        const cx = canvas.width / 2 + shape.ox * Math.min(canvas.width, 900) * 0.5
        const cy = canvas.height / 2 + shape.oy * Math.min(canvas.height, 700) * 0.5
        const pts = shape.vertices.map((v) => {
          let r = rotateX(v, shape.rx)
          r = rotateY(r, shape.ry)
          r = rotateZ(r, shape.rz)
          const [px, py] = project(r, fov)
          return { x: cx + px, y: cy + py }
        })
        allPts.push(...pts.slice(0, 2))
      }

      for (let i = 0; i < allPts.length; i++) {
        for (let j = i + 1; j < allPts.length; j++) {
          const dx = allPts[i].x - allPts[j].x
          const dy = allPts[i].y - allPts[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.12
            ctx.beginPath()
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`
            ctx.lineWidth = 0.4
            ctx.moveTo(allPts[i].x, allPts[i].y)
            ctx.lineTo(allPts[j].x, allPts[j].y)
            ctx.stroke()
          }
        }
      }

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ background: 'transparent', zIndex: 0 }}
    />
  )
}
