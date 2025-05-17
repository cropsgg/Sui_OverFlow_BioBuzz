"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { ArrowRight, FileText, Plus, Users, Vote } from "lucide-react"
import { useEffect, useState } from "react"

export default function GovernancePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DAO Governance</h1>
          <p className="text-muted-foreground">Transparent decision-making for the research community</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Proposal
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Proposals</TabsTrigger>
          <TabsTrigger value="passed">Passed</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="members">DAO Members</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ProposalCard
              title="Add Stanford Neuroscience Lab to DAO"
              description="Proposal to add Stanford Neuroscience Lab as a new member to the LabShareDAO with full access rights."
              proposer="MIT Quantum Computing Lab"
              timeLeft="2 days"
              votes={{ yes: 8, no: 2, abstain: 1 }}
              status="active"
              delay={0}
            />
            <ProposalCard
              title="Increase storage allocation for genomics data"
              description="Proposal to increase the storage allocation for genomics data from 5TB to 10TB per lab."
              proposer="Harvard Medical School"
              timeLeft="4 days"
              votes={{ yes: 6, no: 0, abstain: 2 }}
              status="active"
              delay={0.1}
            />
            <ProposalCard
              title="Fund joint research on quantum computing"
              description="Proposal to allocate 50,000 USDC from the DAO treasury to fund joint research on quantum computing applications in drug discovery."
              proposer="Berkeley Quantum Lab"
              timeLeft="1 day"
              votes={{ yes: 4, no: 3, abstain: 0 }}
              status="active"
              delay={0.2}
            />
            <ProposalCard
              title="Implement new data encryption standard"
              description="Proposal to upgrade the current encryption standard to AES-512 for all shared data within the DAO."
              proposer="Cybersecurity Research Group"
              timeLeft="5 days"
              votes={{ yes: 3, no: 1, abstain: 2 }}
              status="active"
              delay={0.3}
            />
          </div>
        </TabsContent>
        <TabsContent value="passed" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ProposalCard
              title="Expand IoT sensor network"
              description="Proposal to expand the IoT sensor network to include environmental monitoring in all member labs."
              proposer="Environmental Science Lab"
              timeLeft="Passed on May 10, 2025"
              votes={{ yes: 11, no: 1, abstain: 0 }}
              status="passed"
              delay={0}
            />
            <ProposalCard
              title="Integrate with external AI models"
              description="Proposal to integrate the LabShareDAO platform with external AI models for enhanced data analysis."
              proposer="AI Research Institute"
              timeLeft="Passed on May 5, 2025"
              votes={{ yes: 9, no: 2, abstain: 1 }}
              status="passed"
              delay={0.1}
            />
            <ProposalCard
              title="Quarterly security audit requirement"
              description="Proposal to require quarterly security audits for all smart contracts and encryption protocols used by the DAO."
              proposer="Blockchain Security Lab"
              timeLeft="Passed on April 28, 2025"
              votes={{ yes: 12, no: 0, abstain: 0 }}
              status="passed"
              delay={0.2}
            />
          </div>
        </TabsContent>
        <TabsContent value="rejected" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ProposalCard
              title="Reduce encryption requirements for public datasets"
              description="Proposal to reduce encryption requirements for publicly available datasets to improve performance."
              proposer="Data Science Lab"
              timeLeft="Rejected on May 8, 2025"
              votes={{ yes: 2, no: 10, abstain: 0 }}
              status="rejected"
              delay={0}
            />
            <ProposalCard
              title="Centralized backup solution"
              description="Proposal to implement a centralized backup solution for all DAO data."
              proposer="Cloud Computing Research"
              timeLeft="Rejected on April 30, 2025"
              votes={{ yes: 3, no: 8, abstain: 1 }}
              status="rejected"
              delay={0.1}
            />
          </div>
        </TabsContent>
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>DAO Members</CardTitle>
              <CardDescription>Research labs and institutions that are part of LabShareDAO</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <MemberItem
                  name="MIT Quantum Computing Lab"
                  role="Founding Member"
                  joined="January 15, 2025"
                  proposals={5}
                  votes={12}
                  delay={0}
                />
                <MemberItem
                  name="Harvard Medical School"
                  role="Founding Member"
                  joined="January 15, 2025"
                  proposals={3}
                  votes={10}
                  delay={0.1}
                />
                <MemberItem
                  name="Berkeley Quantum Lab"
                  role="Core Member"
                  joined="February 3, 2025"
                  proposals={2}
                  votes={8}
                  delay={0.2}
                />
                <MemberItem
                  name="Environmental Science Lab"
                  role="Core Member"
                  joined="February 10, 2025"
                  proposals={1}
                  votes={7}
                  delay={0.3}
                />
                <MemberItem
                  name="AI Research Institute"
                  role="Core Member"
                  joined="March 5, 2025"
                  proposals={2}
                  votes={6}
                  delay={0.4}
                />
                <MemberItem
                  name="Blockchain Security Lab"
                  role="Core Member"
                  joined="March 20, 2025"
                  proposals={1}
                  votes={5}
                  delay={0.5}
                />
                <MemberItem
                  name="Cybersecurity Research Group"
                  role="Member"
                  joined="April 12, 2025"
                  proposals={1}
                  votes={3}
                  delay={0.6}
                />
                <MemberItem
                  name="Data Science Lab"
                  role="Member"
                  joined="April 25, 2025"
                  proposals={1}
                  votes={2}
                  delay={0.7}
                />
                <MemberItem
                  name="Cloud Computing Research"
                  role="Member"
                  joined="May 1, 2025"
                  proposals={1}
                  votes={1}
                  delay={0.8}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProposalCard({
  title,
  description,
  proposer,
  timeLeft,
  votes,
  status,
  delay,
}: {
  title: string
  description: string
  proposer: string
  timeLeft: string
  votes: { yes: number; no: number; abstain: number }
  status: "active" | "passed" | "rejected"
  delay: number
}) {
  const total = votes.yes + votes.no + votes.abstain
  const yesPercentage = Math.round((votes.yes / total) * 100)
  const noPercentage = Math.round((votes.no / total) * 100)
  const abstainPercentage = Math.round((votes.abstain / total) * 100)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">{title}</CardTitle>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                status === "active"
                  ? "bg-blue-500/20 text-blue-500"
                  : status === "passed"
                    ? "bg-green-500/20 text-green-500"
                    : "bg-red-500/20 text-red-500"
              }`}
            >
              {status === "active" ? "Active" : status === "passed" ? "Passed" : "Rejected"}
            </span>
          </div>
          <CardDescription>Proposed by {proposer}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{description}</p>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Yes: {votes.yes}</span>
              <span>{yesPercentage}%</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full rounded-full" style={{ width: `${yesPercentage}%` }} />
            </div>

            <div className="flex justify-between text-xs">
              <span>No: {votes.no}</span>
              <span>{noPercentage}%</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div className="bg-red-500 h-full rounded-full" style={{ width: `${noPercentage}%` }} />
            </div>

            <div className="flex justify-between text-xs">
              <span>Abstain: {votes.abstain}</span>
              <span>{abstainPercentage}%</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div className="bg-gray-500 h-full rounded-full" style={{ width: `${abstainPercentage}%` }} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <span className="text-xs text-muted-foreground">{timeLeft}</span>
          {status === "active" && (
            <Button>
              <Vote className="mr-2 h-4 w-4" /> Vote
            </Button>
          )}
          {status !== "active" && (
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" /> View Details
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}

function MemberItem({
  name,
  role,
  joined,
  proposals,
  votes,
  delay,
}: {
  name: string
  role: string
  joined: string
  proposals: number
  votes: number
  delay: number
}) {
  return (
    <motion.div
      className="flex items-start space-x-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="bg-primary/10 p-2 rounded-full">
        <Users className="h-5 w-5" />
      </div>
      <div className="space-y-1 flex-1">
        <div className="flex items-center">
          <h4 className="font-medium mr-2">{name}</h4>
          {role === "Founding Member" && (
            <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">Founding</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Role: {role}</p>
        <p className="text-sm text-muted-foreground">Joined: {joined}</p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Proposals: {proposals}</span>
          <span>Votes: {votes}</span>
        </div>
      </div>
      <Button variant="ghost" size="sm">
        View <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </motion.div>
  )
}
