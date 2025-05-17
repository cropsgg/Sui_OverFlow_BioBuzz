"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

export function AIThinkingAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = 80
      }
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Neural network nodes
    const nodes: { x: number; y: number; radius: number; connections: number[] }[] = []
    const numNodes = 15

    // Create nodes
    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 2 + Math.random() * 3,
        connections: [],
      })
    }

    // Create connections (each node connects to 2-3 others)
    nodes.forEach((node, i) => {
      const numConnections = 2 + Math.floor(Math.random())
      for (let j = 0; j < numConnections; j++) {
        let targetIdx
        do {
          targetIdx = Math.floor(Math.random() * numNodes)
        } while (targetIdx === i || node.connections.includes(targetIdx))
        node.connections.push(targetIdx)
      }
    })

    // Particles moving along connections
    const particles: {
      sourceIdx: number
      targetIdx: number
      progress: number
      speed: number
      size: number
      color: string
    }[] = []

    // Create initial particles
    const createParticle = () => {
      const sourceIdx = Math.floor(Math.random() * numNodes)
      const node = nodes[sourceIdx]
      if (node.connections.length === 0) return

      const targetIdx = node.connections[Math.floor(Math.random() * node.connections.length)]

      particles.push({
        sourceIdx,
        targetIdx,
        progress: 0,
        speed: 0.005 + Math.random() * 0.01,
        size: 1.5 + Math.random(),
        color: `rgba(59, 130, 246, ${0.6 + Math.random() * 0.4})`,
      })
    }

    // Create initial particles
    for (let i = 0; i < 20; i++) {
      createParticle()
    }

    // Animation
    let animationFrameId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connections
      ctx.strokeStyle = "rgba(59, 130, 246, 0.15)"
      ctx.lineWidth = 1
      nodes.forEach((node, i) => {
        node.connections.forEach((targetIdx) => {
          const target = nodes[targetIdx]
          ctx.beginPath()
          ctx.moveTo(node.x, node.y)
          ctx.lineTo(target.x, target.y)
          ctx.stroke()
        })
      })

      // Draw nodes
      nodes.forEach((node) => {
        ctx.fillStyle = "rgba(59, 130, 246, 0.5)"
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i]
        particle.progress += particle.speed

        if (particle.progress >= 1) {
          // Particle reached destination, create a new one
          const sourceIdx = particle.targetIdx
          const node = nodes[sourceIdx]

          if (node.connections.length > 0) {
            // Continue the path
            const targetIdx = node.connections[Math.floor(Math.random() * node.connections.length)]
            particle.sourceIdx = sourceIdx
            particle.targetIdx = targetIdx
            particle.progress = 0
          } else {
            // Remove particle and create a new one
            particles.splice(i, 1)
            createParticle()
            continue
          }
        }

        const source = nodes[particle.sourceIdx]
        const target = nodes[particle.targetIdx]

        const x = source.x + (target.x - source.x) * particle.progress
        const y = source.y + (target.y - source.y) * particle.progress

        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(x, y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Occasionally add new particles
      if (Math.random() < 0.05 && particles.length < 30) {
        createParticle()
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="relative w-full">
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
      >
        <div className="text-sm text-primary/80 font-medium">Processing your request...</div>
      </motion.div>
      <canvas ref={canvasRef} className="w-full h-20" />
    </div>
  )
}
