"use client"

import type React from "react"

import { GlowingButton } from "@/components/glowing-button"
import { FuturisticCard } from "@/components/futuristic-card"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Database, Lock, Share2, Zap } from "lucide-react"
import { useEffect, useState } from "react"

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 hex-grid"></div>
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-500 rounded-full blob"></div>
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-purple-500 rounded-full blob"></div>

        <div className="container relative z-10 mx-auto px-4 py-32 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <motion.h1
              className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl glow-text"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <span className="gradient-text">LabShare</span>
              <span className="text-blue-500">DAO</span>
            </motion.h1>
            <motion.p
              className="mt-6 max-w-2xl mx-auto text-xl text-gray-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              A decentralized platform for research labs to securely share data, collaborate, and advance science
              together on the Sui blockchain.
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <GlowingButton asChild size="lg" className="px-8 py-6 text-lg">
              <Link href="/dashboard">
                Launch App <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </GlowingButton>
            <GlowingButton asChild variant="outline" size="lg" className="px-8 py-6 text-lg">
              <Link href="/about">Learn More</Link>
            </GlowingButton>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-background animated-bg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              className="text-3xl font-bold glow-text"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              Revolutionizing Research Collaboration
            </motion.h2>
            <motion.p
              className="mt-4 text-xl text-gray-400 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              Secure, transparent, and efficient data sharing powered by Sui blockchain
            </motion.p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Lock className="h-10 w-10 text-blue-500" />}
              title="End-to-End Encryption"
              description="Your research data is encrypted on the client side before being uploaded, ensuring only authorized recipients can access it."
              delay={0}
            />
            <FeatureCard
              icon={<Database className="h-10 w-10 text-blue-500" />}
              title="Decentralized Storage"
              description="Store large datasets off-chain with tamper-proof references and access control on the blockchain."
              delay={0.1}
            />
            <FeatureCard
              icon={<Share2 className="h-10 w-10 text-blue-500" />}
              title="Secure Collaboration"
              description="Share data with specific labs or researchers with granular permission controls managed by smart contracts."
              delay={0.2}
            />
            <FeatureCard
              icon={<Zap className="h-10 w-10 text-blue-500" />}
              title="AI-Powered Assistant"
              description="Get insights from your data with an integrated LLM that can summarize, analyze, and suggest next steps."
              delay={0.3}
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 gradient-bg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold glow-text">Ready to transform your research workflow?</h2>
            <p className="mt-4 text-xl text-gray-300">
              Join LabShareDAO today and experience the future of decentralized scientific collaboration.
            </p>
            <div className="mt-8">
              <GlowingButton asChild size="lg" className="px-8 py-6 text-lg">
                <Link href="/register">Join the DAO</Link>
              </GlowingButton>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode
  title: string
  description: string
  delay: number
}) {
  return (
    <FuturisticCard variant="glass" delay={delay} className="p-6">
      <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.3 }}>
        <div className="mb-4 bg-blue-500/10 p-3 rounded-full w-fit">{icon}</div>
        <h3 className="text-xl font-semibold mb-2 gradient-text">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </motion.div>
    </FuturisticCard>
  )
}
