"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface FuturisticCardProps {
  children: ReactNode
  className?: string
  glowColor?: string
  variant?: "default" | "glass" | "cyber" | "gradient"
  hoverEffect?: boolean
  delay?: number
}

export function FuturisticCard({
  children,
  className,
  glowColor = "rgba(59, 130, 246, 0.5)",
  variant = "default",
  hoverEffect = true,
  delay = 0,
}: FuturisticCardProps) {
  const getCardClasses = () => {
    switch (variant) {
      case "glass":
        return "glass-card"
      case "cyber":
        return "cyber-box"
      case "gradient":
        return "gradient-border"
      default:
        return "glow-card"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={
        hoverEffect
          ? {
              y: -5,
              boxShadow: `0 10px 30px -15px ${glowColor}`,
              transition: { duration: 0.3 },
            }
          : undefined
      }
      className={cn("rounded-lg border border-border p-4", getCardClasses(), hoverEffect && "hover-scale", className)}
    >
      {children}
    </motion.div>
  )
}
