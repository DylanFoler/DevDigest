'use client'

import { useEffect, useRef } from 'react'

type V3 = [number, number, number]

function rotX(v: V3, a: number): V3 {
  return [v[0], v[1] * Math.cos(a) - v[2] * Math.sin(a), v[1] * Math.sin(a) + v[2] * Math.cos(a)]
}
function rotY(v: V3, a: number): V3 {
  return [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)]
}
function rotZ(v: V3, a: number): V3 {
  return [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]]
}

function project(v: V3, fov: number, cx: number, cy: number): [number, number, number] {
  const d = fov / (fov + v[2])
  return [cx + v[0] * d, cy + v[1] * d, d]
}

function faceNormal(verts: V3[]): V3 {
  const a: V3 = [verts[1][0]-verts[0][0], verts[1][1]-verts[0][1], verts[1][2]-verts[0][2]]
  const b: V3 = [verts[2][0]-verts[0][0], verts[2][1]-verts[0][1], verts[2][2]-verts[0][2]]
  return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]
}

function dot(a: V3, b: V3) { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2] }

// Icosahedron
const phi = (1 + Math.sqrt(5)) / 2
const icoVerts: V3[] = [
  [0,1,phi],[0,-1,phi],[0,1,-phi],[0,-1,-phi],
  [1,phi,0],[-1,phi,0],[1,-phi,0],[-1,-phi,0],
  [phi,0,1],[-phi,0,1],[phi,0,-1],[-phi,0,-1],
]
const icoFaces = [
  [0,1,8],[0,8,4],[0,4,5],[0,5,9],[0,9,1],
  [1,9,7],[1,7,6],[1,6,8],[8,6,10],[8,10,4],
  [4,10,2],[4,2,5],[5,2,11],[5,11,9],[9,11,7],
  [7,11,3],[7,3,6],[6,3,10],[10,3,2],[11,2,3],
]

// Octahedron
const octVerts: V3[] = [
  [0,1,0],[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],
]
const octFaces = [
  [0,2,4],[0,4,3],[0,3,5],[0,5,2],
  [1,4,2],[1,3,4],[1,5,3],[1,2,5],
]

// Cube
const cubeVerts: V3[] = [
  [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
  [-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],
]
const cubeFaces = [
  [0,1,2,3],[4,7,6,5],[0,4,5,1],
  [2,6,7,3],[0,3,7,4],[1,5,6,2],
]

function normalize(v: V3): V3 {
  const len = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2])
  return len > 0 ? [v[0]/len, v[1]/len, v[2]/len] : [0,0,1]
}

function scale(v: V3, s: number): V3 { return [v[0]*s, v[1]*s, v[2]*s] }

const LIGHT: V3 = normalize([0.6, 0.8, 0.5])

interface Shape {
  verts: V3[]
  faces: number[][]
  rx: number; ry: number; rz: number
  drx: number; dry: number; drz: number
  ox: number; oy: number
  size: number
  r: number; g: number; b: number
}

export default function GeometricBackground() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let animId: number

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const icoN = icoVerts.map(normalize)
    const octN = octVerts.map(normalize)
    const cubeN = cubeVerts.map((v) => normalize(v))

    const shapes: Shape[] = [
      { verts: icoN,   faces: icoFaces,  rx:0,   ry:0,   rz:0,   drx:0.0018, dry:0.0032, drz:0.0014, ox:-0.30, oy:-0.15, size:220, r:190, g:200, b:220 },
      { verts: octN,   faces: octFaces,  rx:1,   ry:0.5, rz:0.3, drx:0.0035, dry:0.0020, drz:0.0025, ox: 0.32, oy: 0.22, size:160, r:160, g:170, b:195 },
      { verts: cubeN,  faces: cubeFaces, rx:0.5, ry:1,   rz:0.5, drx:0.0022, dry:0.0038, drz:0.0017, ox: 0.05, oy:-0.30, size:130, r:210, g:215, b:230 },
    ]

    function drawHexGrid() {
      const size = 48
      const w = size * Math.sqrt(3)
      const h = size * 2
      ctx!.save()
      ctx!.strokeStyle = 'rgba(180,190,210,0.05)'
      ctx!.lineWidth = 0.7
      for (let row = -1; row * h * 0.75 < canvas!.height + h; row++) {
        for (let col = -1; col * w < canvas!.width + w; col++) {
          const x = col * w + (row % 2 === 0 ? 0 : w / 2)
          const y = row * h * 0.75
          ctx!.beginPath()
          for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 3 * i + Math.PI / 6
            const px = x + size * Math.cos(angle)
            const py = y + size * Math.sin(angle)
            i === 0 ? ctx!.moveTo(px, py) : ctx!.lineTo(px, py)
          }
          ctx!.closePath()
          ctx!.stroke()
        }
      }
      ctx!.restore()
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawHexGrid()

      for (const shape of shapes) {
        shape.rx += shape.drx
        shape.ry += shape.dry
        shape.rz += shape.drz

        const cx = canvas.width  / 2 + shape.ox * Math.min(canvas.width,  900) * 0.5
        const cy = canvas.height / 2 + shape.oy * Math.min(canvas.height, 700) * 0.5
        const fov = 420

        // Transform all vertices
        const transformed: V3[] = shape.verts.map((v) => {
          let t = scale(v, shape.size)
          t = rotX(t, shape.rx)
          t = rotY(t, shape.ry)
          t = rotZ(t, shape.rz)
          return t
        })

        // Compute face data
        const faceData = shape.faces.map((face) => {
          const fv = face.map((i) => transformed[i])
          const n = normalize(faceNormal(fv))
          const avgZ = fv.reduce((s, v) => s + v[2], 0) / fv.length
          const light = Math.max(0, dot(n, LIGHT))
          const proj = fv.map((v) => project(v, fov, cx, cy))
          return { face, fv, n, avgZ, light, proj }
        })

        // Painter's algorithm: sort back-to-front
        faceData.sort((a, b) => a.avgZ - b.avgZ)

        const { r, g, b } = shape

        for (const { light, proj, n } of faceData) {
          // Backface culling: skip faces pointing away (optional, gives see-through)
          // const viewDot = n[2]  // simplified — skip if < -0.1

          const fillA = 0.02 + light * 0.07
          const strokeA = 0.10 + light * 0.20

          ctx.beginPath()
          ctx.moveTo(proj[0][0], proj[0][1])
          for (let i = 1; i < proj.length; i++) ctx.lineTo(proj[i][0], proj[i][1])
          ctx.closePath()

          ctx.fillStyle = `rgba(${r},${g},${b},${fillA})`
          ctx.fill()
          ctx.strokeStyle = `rgba(${r},${g},${b},${strokeA})`
          ctx.lineWidth = 0.8
          ctx.stroke()
        }
      }

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 pointer-events-none"
      style={{ background: 'transparent', zIndex: 0 }}
    />
  )
}
