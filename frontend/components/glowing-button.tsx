"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import type { ButtonHTMLAttributes } from "react"
import type { VariantProps } from "class-variance-authority"

interface GlowingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof Button> {
  children: React.ReactNode
  glowColor?: string
  className?: string
  asChild?: boolean
  isAnimated?: boolean
}

export function GlowingButton({
  children,
  glowColor = "rgba(59, 130, 246, 0.7)",
  className,
  variant = "default",
  size,
  asChild = false,
  isAnimated = true,
  ...props
}: GlowingButtonProps) {
  const buttonContent = (
    <Button
      variant={variant}
      size={size}
      asChild={asChild}
      className={cn("relative overflow-hidden cyber-button", className)}
      {...props}
    >
      {children}
    </Button>
  )

  if (!isAnimated) {
    return buttonContent
  }

  return (
    <motion.div
      className="relative"
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className="absolute inset-0 rounded-md opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          boxShadow: `0 0 20px ${glowColor}`,
          filter: "blur(15px)",
        }}
      />
      {buttonContent}
    </motion.div>
  )
}
