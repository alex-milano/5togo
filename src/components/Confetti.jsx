import { useEffect, useRef } from 'react'

const COLORS = ['#ff6b35', '#ffd700', '#2dc653', '#4cc9f0', '#e63946', '#9b5de5', '#ff8fab']
const PIECE_COUNT = 80

function rand(min, max) { return Math.random() * (max - min) + min }

export default function Confetti({ active }) {
  const canvasRef = useRef(null)
  const piecesRef = useRef([])
  const rafRef    = useRef(null)

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(rafRef.current)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    piecesRef.current = Array.from({ length: PIECE_COUNT }, () => ({
      x:    rand(0, canvas.width),
      y:    rand(-canvas.height, 0),
      r:    rand(6, 14),
      d:    rand(0, Math.PI * 2),
      color: COLORS[Math.floor(rand(0, COLORS.length))],
      tilt: rand(-10, 10),
      tiltAngle: 0,
      tiltAngleInc: rand(0.05, 0.12),
      speed: rand(2, 5),
    }))

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      piecesRef.current.forEach(p => {
        ctx.beginPath()
        ctx.lineWidth = p.r / 2
        ctx.strokeStyle = p.color
        ctx.moveTo(p.x + p.tilt + p.r / 4, p.y)
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4)
        ctx.stroke()

        p.tiltAngle += p.tiltAngleInc
        p.y += p.speed
        p.tilt = Math.sin(p.tiltAngle) * 15

        if (p.y > canvas.height) {
          p.x = rand(0, canvas.width)
          p.y = -20
        }
      })
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    // Auto-stop after 4 seconds
    const stop = setTimeout(() => cancelAnimationFrame(rafRef.current), 4000)

    return () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(stop)
    }
  }, [active])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        pointerEvents: 'none',
        zIndex: 300,
      }}
    />
  )
}
