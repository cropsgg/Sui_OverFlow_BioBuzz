"use client"

import { useEffect, useRef } from "react"

export function AnimatedGradientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Create gradient points
    const gradientPoints = [
      { x: canvas.width * 0.1, y: canvas.height * 0.1, radius: canvas.width * 0.3, color: "rgba(59, 130, 246, 0.05)" },
      { x: canvas.width * 0.8, y: canvas.height * 0.3, radius: canvas.width * 0.4, color: "rgba(139, 92, 246, 0.05)" },
      { x: canvas.width * 0.5, y: canvas.height * 0.8, radius: canvas.width * 0.35, color: "rgba(59, 130, 246, 0.05)" },
    ]

    // Animation variables
    let animationFrameId: number
    let time = 0

    // Animation function
    const animate = () => {
      time += 0.005
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update gradient positions
      gradientPoints.forEach((point, index) => {
        point.x = canvas.width * (0.2 + 0.6 * Math.sin(time + index * Math.PI * 0.67) * 0.5 + 0.5)
        point.y = canvas.height * (0.2 + 0.6 * Math.cos(time + index * Math.PI * 0.67) * 0.5 + 0.5)
      })

      // Draw gradients
      gradientPoints.forEach((point) => {
        const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, point.radius)
        gradient.addColorStop(0, point.color)
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 -z-20" />
}
