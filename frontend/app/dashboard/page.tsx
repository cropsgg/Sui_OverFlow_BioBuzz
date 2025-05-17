"use client"

import type React from "react"

import { GlowingButton } from "@/components/glowing-button"
import { FuturisticCard } from "@/components/futuristic-card"
import { DataVisualization } from "@/components/data-visualization"
import { BlockchainVisualization } from "@/components/3d-blockchain-visualization"
import { DAOGovernanceModel } from "@/components/3d-dao-governance"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { Activity, FileText, Lock, Users, Zap } from "lucide-react"
import { useEffect, useState } from "react"

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Sample data for visualization
  const activityData = [0.3, 0.5, 0.2, 0.8, 0.4, 0.6, 0.7, 0.3, 0.9, 0.5, 0.6, 0.8]
  const temperatureData = [0.2, 0.3, 0.4, 0.3, 0.5, 0.6, 0.5, 0.4, 0.3, 0.5, 0.7, 0.6]
  const storageData = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.7, 0.6, 0.5, 0.6]

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <motion.h1
            className="text-3xl font-bold tracking-tight gradient-text"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            Dashboard
          </motion.h1>
          <motion.p
            className="text-muted-foreground"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Welcome back, Dr. Smith. Here's what's happening in your lab network.
          </motion.p>
        </div>
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlowingButton>
            <FileText className="mr-2 h-4 w-4" /> Upload Data
          </GlowingButton>
          <GlowingButton variant="outline">
            <Users className="mr-2 h-4 w-4" /> Invite Lab
          </GlowingButton>
        </motion.div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="glass-card">
          <TabsTrigger value="overview" className="data-[state=active]:gradient-text">
            Overview
          </TabsTrigger>
          <TabsTrigger value="blockchain" className="data-[state=active]:gradient-text">
            Blockchain
          </TabsTrigger>
          <TabsTrigger value="governance" className="data-[state=active]:gradient-text">
            Governance
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:gradient-text">
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Connected Labs"
              value="12"
              description="+2 this month"
              icon={<Users className="h-4 w-4 text-blue-400" />}
              delay={0}
              data={activityData}
            />
            <StatsCard
              title="Shared Datasets"
              value="48"
              description="+5 this week"
              icon={<FileText className="h-4 w-4 text-purple-400" />}
              delay={0.1}
              data={temperatureData}
              color="#a78bfa"
              glowColor="rgba(167, 139, 250, 0.5)"
            />
            <StatsCard
              title="Active Sensors"
              value="36"
              description="2 alerts"
              icon={<Activity className="h-4 w-4 text-green-400" />}
              delay={0.2}
              data={storageData}
              color="#4ade80"
              glowColor="rgba(74, 222, 128, 0.5)"
            />
            <StatsCard
              title="AI Queries"
              value="128"
              description="+23% from last week"
              icon={<Zap className="h-4 w-4 text-yellow-400" />}
              delay={0.3}
              data={[0.4, 0.3, 0.5, 0.6, 0.8, 0.7, 0.9, 0.8, 0.7, 0.8, 0.9, 0.8]}
              color="#facc15"
              glowColor="rgba(250, 204, 21, 0.5)"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <FuturisticCard className="col-span-4 p-0" variant="glass">
              <CardHeader>
                <CardTitle className="gradient-text">Recent Data Sharing Activity</CardTitle>
                <CardDescription>Encrypted data transfers across your network</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] relative">
                  <DataFlowVisualization />
                </div>
              </CardContent>
            </FuturisticCard>
            <FuturisticCard className="col-span-3 p-0" variant="glass">
              <CardHeader>
                <CardTitle className="gradient-text">Active Proposals</CardTitle>
                <CardDescription>DAO governance proposals requiring your attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ProposalItem
                    title="Add Stanford Neuroscience Lab to DAO"
                    status="Active"
                    votes={{ yes: 8, no: 2, abstain: 1 }}
                    timeLeft="2 days"
                    delay={0}
                  />
                  <ProposalItem
                    title="Increase storage allocation for genomics data"
                    status="Active"
                    votes={{ yes: 6, no: 0, abstain: 2 }}
                    timeLeft="4 days"
                    delay={0.1}
                  />
                  <ProposalItem
                    title="Fund joint research on quantum computing"
                    status="Active"
                    votes={{ yes: 4, no: 3, abstain: 0 }}
                    timeLeft="1 day"
                    delay={0.2}
                  />
                </div>
              </CardContent>
            </FuturisticCard>
          </div>
        </TabsContent>

        <TabsContent value="blockchain" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FuturisticCard variant="glass" className="p-0">
              <CardHeader>
                <CardTitle className="gradient-text">Blockchain Network</CardTitle>
                <CardDescription>Real-time view of the Sui blockchain ecosystem</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <BlockchainVisualization />
              </CardContent>
            </FuturisticCard>

            <FuturisticCard variant="glass" className="p-0">
              <CardHeader>
                <CardTitle className="gradient-text">Transaction History</CardTitle>
                <CardDescription>Recent blockchain transactions and events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <TransactionItem
                    title="Data Access Grant"
                    description="MIT Lab granted access to CRISPR-Cas9 Results dataset"
                    hash="0x7a16ff...3a91"
                    time="10 minutes ago"
                    success={true}
                    delay={0}
                  />
                  <TransactionItem
                    title="New Member Proposal"
                    description="Stanford Lab submitted application to join the DAO"
                    hash="0x3b82f6...9d42"
                    time="2 hours ago"
                    success={true}
                    delay={0.1}
                  />
                  <TransactionItem
                    title="Governance Vote"
                    description="Your vote on 'Fund joint research' proposal was recorded"
                    hash="0x8b5cf6...1e37"
                    time="Yesterday"
                    success={true}
                    delay={0.2}
                  />
                  <TransactionItem
                    title="Smart Contract Update"
                    description="DAO access control module was updated to v2.3"
                    hash="0xef4444...7b28"
                    time="3 days ago"
                    success={true}
                    delay={0.3}
                  />
                </div>
              </CardContent>
            </FuturisticCard>
          </div>
        </TabsContent>

        <TabsContent value="governance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FuturisticCard variant="glass" className="p-0">
              <CardHeader>
                <CardTitle className="gradient-text">DAO Governance</CardTitle>
                <CardDescription>Decentralized decision making visualization</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <DAOGovernanceModel voteData={[70, 20, 10]} />
              </CardContent>
            </FuturisticCard>

            <FuturisticCard variant="glass" className="p-0">
              <CardHeader>
                <CardTitle className="gradient-text">Your Voting Power</CardTitle>
                <CardDescription>Current influence in the LabShareDAO governance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4">
                  <div className="mb-8 space-y-4">
                    <div>
                      <div className="mb-2 flex justify-between">
                        <span className="text-sm font-medium text-blue-400">Total Voting Power</span>
                        <span className="text-sm text-blue-400">8,750 / 100,000</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                          initial={{ width: 0 }}
                          animate={{ width: "8.75%" }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex justify-between">
                        <span className="text-sm font-medium text-green-400">Delegation Received</span>
                        <span className="text-sm text-green-400">2,500</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary">
                        <motion.div
                          className="h-full rounded-full bg-green-500"
                          initial={{ width: 0 }}
                          animate={{ width: "28.6%" }}
                          transition={{ duration: 1, delay: 0.7 }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex justify-between">
                        <span className="text-sm font-medium text-purple-400">Delegation Given</span>
                        <span className="text-sm text-purple-400">1,000</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary">
                        <motion.div
                          className="h-full rounded-full bg-purple-500"
                          initial={{ width: 0 }}
                          animate={{ width: "11.4%" }}
                          transition={{ duration: 1, delay: 0.9 }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 rounded-xl border border-blue-500/30 p-4">
                    <h3 className="mb-2 text-lg font-semibold gradient-text">Voting History</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Total Votes Cast</span>
                        <span className="font-medium">12</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Proposals Created</span>
                        <span className="font-medium">3</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Consensus Alignment</span>
                        <span className="font-medium text-green-400">92%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </FuturisticCard>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <FuturisticCard variant="glass" className="p-0">
            <CardHeader>
              <CardTitle className="gradient-text">Security Overview</CardTitle>
              <CardDescription>End-to-end encryption and blockchain verification status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <SecurityItem
                  title="End-to-End Encryption"
                  status="Active"
                  description="All data is encrypted using AES-256"
                  icon={<Lock className="h-5 w-5 text-green-500" />}
                  delay={0}
                />
                <SecurityItem
                  title="Blockchain Verification"
                  status="Active"
                  description="Last block verified 5 minutes ago"
                  icon={<Activity className="h-5 w-5 text-green-500" />}
                  delay={0.1}
                />
                <SecurityItem
                  title="Access Controls"
                  status="Active"
                  description="12 labs with varying permission levels"
                  icon={<Users className="h-5 w-5 text-green-500" />}
                  delay={0.2}
                />
                <SecurityItem
                  title="Smart Contract Audit"
                  status="Completed"
                  description="Last audit completed on May 10, 2025"
                  icon={<FileText className="h-5 w-5 text-green-500" />}
                  delay={0.3}
                />
              </div>
            </CardContent>
          </FuturisticCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatsCard({
  title,
  value,
  description,
  icon,
  delay,
  data,
  color = "#3b82f6",
  glowColor = "rgba(59, 130, 246, 0.5)",
}: {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  delay: number
  data: number[]
  color?: string
  glowColor?: string
}) {
  return (
    <FuturisticCard variant="glass" delay={delay} className="p-0">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            <span className="text-2xl font-bold gradient-text">{value}</span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
          <div className="p-2 bg-background/30 rounded-full">{icon}</div>
        </div>
        <div className="mt-4 h-10">
          <DataVisualization data={data} height={40} color={color} glowColor={glowColor} />
        </div>
      </CardContent>
    </FuturisticCard>
  )
}

function ProposalItem({
  title,
  status,
  votes,
  timeLeft,
  delay,
}: {
  title: string
  status: string
  votes: { yes: number; no: number; abstain: number }
  timeLeft: string
  delay: number
}) {
  const total = votes.yes + votes.no + votes.abstain
  const yesPercentage = Math.round((votes.yes / total) * 100)
  const noPercentage = Math.round((votes.no / total) * 100)
  const abstainPercentage = Math.round((votes.abstain / total) * 100)

  return (
    <motion.div
      className="border border-blue-500/20 rounded-lg p-4 glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{
        y: -5,
        boxShadow: "0 10px 30px -15px rgba(59, 130, 246, 0.2)",
        borderColor: "rgba(59, 130, 246, 0.3)",
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium gradient-text">{title}</h4>
        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">{status}</span>
      </div>
      <div className="space-y-2 mb-2">
        <div className="flex justify-between text-xs">
          <span>Yes: {votes.yes}</span>
          <span>{yesPercentage}%</span>
        </div>
        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
          <motion.div
            className="bg-green-500 h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${yesPercentage}%` }}
            transition={{ duration: 1, delay: delay + 0.3 }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span>No: {votes.no}</span>
          <span>{noPercentage}%</span>
        </div>
        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
          <motion.div
            className="bg-red-500 h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${noPercentage}%` }}
            transition={{ duration: 1, delay: delay + 0.4 }}
          />
        </div>
      </div>
      <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
        <span>Time left: {timeLeft}</span>
        <GlowingButton variant="outline" size="sm">
          Vote
        </GlowingButton>
      </div>
    </motion.div>
  )
}

function TransactionItem({
  title,
  description,
  hash,
  time,
  success,
  delay,
}: {
  title: string
  description: string
  hash: string
  time: string
  success: boolean
  delay: number
}) {
  return (
    <motion.div
      className="flex items-start space-x-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ x: 5 }}
    >
      <div className={`bg-${success ? "green" : "red"}-500/10 p-2 rounded-full`}>
        {success ? <Activity className="h-5 w-5 text-green-500" /> : <Activity className="h-5 w-5 text-red-500" />}
      </div>
      <div className="space-y-1 flex-1">
        <h4 className="font-medium gradient-text">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{hash}</span>
          <span>•</span>
          <span>{time}</span>
          <span
            className={`text-xs bg-${success ? "green" : "red"}-500/20 text-${success ? "green" : "red"}-500 px-2 py-0.5 rounded-full ml-auto`}
          >
            {success ? "Confirmed" : "Failed"}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

function SecurityItem({
  title,
  status,
  description,
  icon,
  delay,
}: {
  title: string
  status: string
  description: string
  icon: React.ReactNode
  delay: number
}) {
  return (
    <motion.div
      className="flex items-start space-x-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ x: 5 }}
    >
      <div className="bg-green-500/10 p-2 rounded-full">{icon}</div>
      <div className="space-y-1">
        <div className="flex items-center">
          <h4 className="font-medium gradient-text mr-2">{title}</h4>
          <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">{status}</span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  )
}

function DataFlowVisualization() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 300" className="absolute inset-0">
      {/* Labs/Nodes */}
      <g>
        <circle
          cx="100"
          cy="150"
          r="30"
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth="2"
          className="glow-border"
        />
        <text x="100" y="150" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="12">
          Lab A
        </text>

        <circle
          cx="250"
          cy="80"
          r="30"
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth="2"
          className="glow-border"
        />
        <text x="250" y="80" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="12">
          Lab B
        </text>

        <circle
          cx="400"
          cy="200"
          r="30"
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth="2"
          className="glow-border"
        />
        <text x="400" y="200" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="12">
          Lab C
        </text>

        <circle
          cx="550"
          cy="100"
          r="30"
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth="2"
          className="glow-border"
        />
        <text x="550" y="100" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="12">
          Lab D
        </text>

        <circle
          cx="700"
          cy="180"
          r="30"
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth="2"
          className="glow-border"
        />
        <text x="700" y="180" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="12">
          Lab E
        </text>
      </g>

      {/* Data Flow Paths */}
      <g>
        <path
          d="M130 150 C 180 130, 200 100, 220 80"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="5,5"
          className="data-flow-animation"
          filter="url(#glow)"
        />

        <path
          d="M280 80 C 320 120, 350 150, 370 200"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="5,5"
          className="data-flow-animation"
          filter="url(#glow)"
        />

        <path
          d="M430 200 C 470 170, 500 130, 520 100"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="5,5"
          className="data-flow-animation"
          filter="url(#glow)"
        />

        <path
          d="M580 100 C 620 130, 650 150, 670 180"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="5,5"
          className="data-flow-animation"
          filter="url(#glow)"
        />

        <path
          d="M100 180 C 200 250, 600 250, 700 210"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="5,5"
          className="data-flow-animation"
          filter="url(#glow)"
        />
      </g>

      {/* Data Packets */}
      <g>
        <circle cx="180" cy="115" r="5" fill="#3b82f6" className="animate-pulse" filter="url(#glow)" />
        <circle cx="350" cy="150" r="5" fill="#3b82f6" className="animate-pulse" filter="url(#glow)" />
        <circle cx="500" cy="130" r="5" fill="#3b82f6" className="animate-pulse" filter="url(#glow)" />
        <circle cx="650" cy="150" r="5" fill="#3b82f6" className="animate-pulse" filter="url(#glow)" />
        <circle cx="400" cy="250" r="5" fill="#3b82f6" className="animate-pulse" filter="url(#glow)" />
      </g>

      {/* Glow Filter */}
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Legend */}
      <g transform="translate(600, 30)">
        <rect x="0" y="0" width="140" height="80" rx="4" fill="rgba(0,0,0,0.3)" className="glass-card" />

        <circle cx="15" cy="20" r="5" fill="#3b82f6" />
        <text x="30" y="25" fill="white" fontSize="12">
          Freezer #1
        </text>

        <circle cx="15" cy="45" r="5" fill="#8b5cf6" />
        <text x="30" y="50" fill="white" fontSize="12">
          Freezer #2
        </text>

        <circle cx="15" cy="70" r="5" fill="#ef4444" />
        <text x="30" y="75" fill="white" fontSize="12">
          Freezer #3
        </text>
      </g>

      {/* Alert Zone */}
      <rect x="610" y="50" width="140" height="200" fill="rgba(239, 68, 68, 0.1)" />
      <text x="680" y="40" fill="#ef4444" fontSize="12" textAnchor="middle" className="glow-text">
        Alert Zone
      </text>
    </svg>
  )
}
