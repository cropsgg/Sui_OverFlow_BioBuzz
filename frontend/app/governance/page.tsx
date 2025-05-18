"use client"

import { Button } from "@/components/ui/button"
import { AccessControl } from "@/components/access-control"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { ArrowRight, FileText, Loader, Plus, Users, Vote } from "lucide-react"
import { useEffect, useState } from "react"
import { useBlockchain } from "@/blockchain/provider"
import { setTransactionTracker } from "@/blockchain/labshare-dao"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

export default function GovernancePage() {
  return (
    <AccessControl>
      <GovernanceContent />
    </AccessControl>
  )
}

function GovernanceContent() {
  const [mounted, setMounted] = useState(false)
  const { daoClient, isConnected, walletAddress, addTransaction } = useBlockchain()
  const [proposalTitle, setProposalTitle] = useState("")
  const [proposalDescription, setProposalDescription] = useState("")
  const [proposalType, setProposalType] = useState("general")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Set the transaction tracker to use the blockchain context
    setTransactionTracker(addTransaction)
  }, [addTransaction])

  const handleCreateProposal = async () => {
    if (!isConnected || !walletAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create a proposal",
        variant: "destructive"
      })
      return
    }
    
    // Check if any wallet extension exists
    if (typeof window !== 'undefined' && 
        !(window as any).wallet && 
        !(window as any).suiWallet && 
        !(window as any).slush && 
        !(window as any).sui &&
        !((window as any).ethereum?.isEthos)) {
      toast({
        title: "Wallet Extension Missing",
        description: "Please install a compatible Sui wallet extension (Sui Wallet, Slush, Ethos) and refresh the page",
        variant: "destructive"
      })
      return
    }

    if (!proposalTitle || !proposalDescription) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and description for your proposal",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await daoClient.createProposal(proposalTitle, proposalDescription, proposalType)
      
      if (result && result !== "error-transaction" && result !== "failed-transaction") {
        toast({
          title: "Proposal Created",
          description: "Your proposal has been successfully submitted to the DAO",
        })
        setDialogOpen(false)
        setProposalTitle("")
        setProposalDescription("")
        setProposalType("general")
      } else {
        toast({
          title: "Transaction Failed",
          description: "There was an error creating your proposal. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating proposal:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DAO Governance</h1>
          <p className="text-muted-foreground">Transparent decision-making for the research community</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Proposal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass-card">
              <DialogHeader>
                <DialogTitle>Create New Proposal</DialogTitle>
                <DialogDescription>
                  Create a new proposal for the LabShareDAO community to vote on.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={proposalTitle}
                    onChange={(e) => setProposalTitle(e.target.value)}
                    className="col-span-3"
                    placeholder="Proposal Title"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Select value={proposalType} onValueChange={setProposalType}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select proposal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="configuration">Configuration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={proposalDescription}
                    onChange={(e) => setProposalDescription(e.target.value)}
                    className="col-span-3"
                    placeholder="Detailed description of your proposal"
                    rows={5}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateProposal} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>Submit Proposal</>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
  proposalId = "",
}: {
  title: string
  description: string
  proposer: string
  timeLeft: string
  votes: { yes: number; no: number; abstain: number }
  status: "active" | "passed" | "rejected"
  delay: number
  proposalId?: string
}) {
  const { daoClient, isConnected, walletAddress } = useBlockchain();
  const [isVoting, setIsVoting] = useState(false);
  const [selectedVote, setSelectedVote] = useState<"yes" | "no" | "abstain" | null>(null);

  const voteTotal = votes.yes + votes.no + votes.abstain
  const yesPercentage = (votes.yes / voteTotal) * 100
  const noPercentage = (votes.no / voteTotal) * 100
  const abstainPercentage = (votes.abstain / voteTotal) * 100

  const handleVote = async (vote: "yes" | "no" | "abstain") => {
    if (!isConnected || !walletAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to vote on proposals",
        variant: "destructive"
      });
      return;
    }
    
    // Check if any wallet extension exists
    if (typeof window !== 'undefined' && 
        !(window as any).wallet && 
        !(window as any).suiWallet && 
        !(window as any).slush && 
        !(window as any).sui &&
        !((window as any).ethereum?.isEthos)) {
      toast({
        title: "Wallet Extension Missing",
        description: "Please install a compatible Sui wallet extension (Sui Wallet, Slush, Ethos) and refresh the page",
        variant: "destructive"
      });
      return;
    }

    if (!proposalId || proposalId === "") {
      toast({
        title: "Demo Mode",
        description: "This is a demo proposal. Voting is simulated.",
      });
      setSelectedVote(vote);
      return;
    }

    setIsVoting(true);
    setSelectedVote(vote);

    try {
      const result = await daoClient.vote(proposalId, vote);
      
      if (result) {
        toast({
          title: "Vote Submitted",
          description: `Your ${vote} vote has been recorded on the blockchain`,
        });
      } else {
        toast({
          title: "Vote Failed",
          description: "There was an error submitting your vote. Please try again.",
          variant: "destructive"
        });
        setSelectedVote(null);
      }
    } catch (error) {
      console.error("Error voting on proposal:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive"
      });
      setSelectedVote(null);
    } finally {
      setIsVoting(false);
    }
  };

  const statusColors = {
    active: "text-blue-500 border-blue-500",
    passed: "text-green-500 border-green-500",
    rejected: "text-red-500 border-red-500",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{title}</CardTitle>
            <div
              className={`px-2 py-1 text-xs border rounded-full uppercase font-semibold ${
                statusColors[status]
              }`}
            >
              {status}
            </div>
          </div>
          <CardDescription>Proposed by {proposer}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-500">Yes ({votes.yes})</span>
                <span>{Math.round(yesPercentage)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-green-500 h-2.5 rounded-full"
                  style={{ width: `${yesPercentage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-red-500">No ({votes.no})</span>
                <span>{Math.round(noPercentage)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-red-500 h-2.5 rounded-full"
                  style={{ width: `${noPercentage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-yellow-500">Abstain ({votes.abstain})</span>
                <span>{Math.round(abstainPercentage)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-yellow-500 h-2.5 rounded-full"
                  style={{ width: `${abstainPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground flex items-center">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${status === "active" ? "bg-blue-500 animate-pulse" : ""}`}
            ></div>
            {timeLeft}
          </div>
          {status === "active" && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={selectedVote === "yes" ? "default" : "outline"} 
                className={`border-green-500 ${selectedVote === "yes" ? "bg-green-600" : "hover:bg-green-600/20"}`}
                onClick={() => handleVote("yes")}
                disabled={isVoting}
              >
                {isVoting && selectedVote === "yes" ? (
                  <Loader className="h-4 w-4 mr-1 animate-spin" />
                ) : null}
                Yes
              </Button>
              <Button 
                size="sm" 
                variant={selectedVote === "no" ? "default" : "outline"} 
                className={`border-red-500 ${selectedVote === "no" ? "bg-red-600" : "hover:bg-red-600/20"}`}
                onClick={() => handleVote("no")}
                disabled={isVoting}
              >
                {isVoting && selectedVote === "no" ? (
                  <Loader className="h-4 w-4 mr-1 animate-spin" />
                ) : null}
                No
              </Button>
              <Button 
                size="sm" 
                variant={selectedVote === "abstain" ? "default" : "outline"}
                className={`border-yellow-500 ${selectedVote === "abstain" ? "bg-yellow-600" : "hover:bg-yellow-600/20"}`}
                onClick={() => handleVote("abstain")}
                disabled={isVoting}
              >
                {isVoting && selectedVote === "abstain" ? (
                  <Loader className="h-4 w-4 mr-1 animate-spin" />
                ) : null}
                Abstain
              </Button>
            </div>
          )}
          {status !== "active" && (
            <Button size="sm" variant="outline">
              <FileText className="h-4 w-4 mr-2" /> View Details
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
