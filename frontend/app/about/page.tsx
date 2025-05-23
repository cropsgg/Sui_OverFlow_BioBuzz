"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BarChart3, Brain, Code, Dna, FileText, FlaskConical, Github, Link2, Linkedin, Lock, Share2, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FuturisticCard } from "@/components/futuristic-card"
import { useState } from "react"

export default function AboutPage() {
  const [mounted, setMounted] = useState(true)

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0 hex-grid"></div>
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight glow-text mb-6">
              About <span className="gradient-text">LabShare</span>
              <span className="text-blue-500">DAO</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              A decentralized platform empowering scientific collaboration through secure data sharing
              and transparent research governance on the Sui blockchain.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Card className="backdrop-blur-md bg-background/40 border-border/40">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Our Mission</CardTitle>
              <CardDescription className="text-lg">
                Transforming how research labs collaborate and share data
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p>
                LabShareDAO was born from a simple yet powerful idea: scientific progress thrives on collaboration,
                but traditional research models create silos that hinder innovation. Our mission is to break down these barriers
                by creating a decentralized platform where research labs worldwide can securely share data,
                collaborate on projects, and advance science together.
              </p>
              <p>
                Built on the Sui blockchain, LabShareDAO provides researchers with the tools they need to maintain ownership
                and control of their data while facilitating seamless collaboration with colleagues across institutions and borders.
                By incentivizing data sharing through tokenized contributions, we're creating a new model for scientific research
                that is more open, efficient, and equitable.
              </p>
              <p>
                Our vision is a future where breakthroughs happen faster because researchers have access to more data and expertise,
                where credit for contributions is transparently recorded and recognized, and where the benefits of scientific
                advancement are more widely shared. We're building that future, one block at a time.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold glow-text mb-2">Key Features</h2>
            <p className="text-xl text-gray-400">Innovative tools for the future of research</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Lock className="h-6 w-6 text-blue-500" />}
              title="End-to-End Encryption"
              description="Your research data is encrypted on the client side before being uploaded, ensuring only authorized recipients can access it."
            />
            <FeatureCard 
              icon={<Share2 className="h-6 w-6 text-blue-500" />}
              title="Decentralized Sharing"
              description="Share data with specific labs or researchers with granular permission controls managed by smart contracts."
            />
            <FeatureCard 
              icon={<Dna className="h-6 w-6 text-blue-500" />}
              title="Research Governance"
              description="Democratic decision-making through DAO voting mechanisms ensures transparent research priorities and resource allocation."
            />
            <FeatureCard 
              icon={<Brain className="h-6 w-6 text-blue-500" />}
              title="AI-Powered Assistant"
              description="Get insights from your data with an integrated LLM that can summarize, analyze, and suggest next steps for your research."
            />
            <FeatureCard 
              icon={<FileText className="h-6 w-6 text-blue-500" />}
              title="Immutable Records"
              description="All research contributions and data exchanges are recorded on the blockchain, creating a verifiable publication and citation record."
            />
            <FeatureCard 
              icon={<FlaskConical className="h-6 w-6 text-blue-500" />}
              title="IoT Integration"
              description="Connect your lab equipment for real-time data collection, monitoring, and secure sharing with collaborators."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold glow-text mb-2">How It Works</h2>
            <p className="text-xl text-gray-400">Simplifying complex research collaboration</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="backdrop-blur-md bg-background/40 border-border/40">
              <CardHeader className="text-center">
                <div className="bg-blue-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-500">1</span>
                </div>
                <CardTitle>Connect</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-300">
                  Connect your Sui wallet, create a researcher profile, and join or establish a research lab DAO.
                </p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md bg-background/40 border-border/40">
              <CardHeader className="text-center">
                <div className="bg-blue-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-500">2</span>
                </div>
                <CardTitle>Collaborate</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-300">
                  Upload and encrypt research data, set permissions, and share with specific collaborators or labs.
                </p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md bg-background/40 border-border/40">
              <CardHeader className="text-center">
                <div className="bg-blue-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-500">3</span>
                </div>
                <CardTitle>Contribute</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-300">
                  Earn contribution tokens for sharing valuable data, participate in governance decisions, and advance science together.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold glow-text mb-2">Our Team</h2>
            <p className="text-xl text-gray-400">The minds behind LabShareDAO</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <TeamMember 
              name="Dr. Elena Chen"
              role="Founder & CEO"
              bio="PhD in Molecular Biology with 15+ years experience in research and open science advocacy."
              avatarSrc="/team/avatar1.jpg"
              fallback="EC"
            />
            <TeamMember 
              name="Marcus Okonjo"
              role="CTO"
              bio="Blockchain architect and former research scientist with a passion for decentralized systems."
              avatarSrc="/team/avatar2.jpg"
              fallback="MO"
            />
            <TeamMember 
              name="Dr. Sophia Patel"
              role="Chief Research Officer"
              bio="Computational biologist specializing in AI-assisted research and data analysis."
              avatarSrc="/team/avatar3.jpg"
              fallback="SP"
            />
            <TeamMember 
              name="James Rodriguez"
              role="Head of Product"
              bio="Former lab director with expertise in UX design and scientific workflows."
              avatarSrc="/team/avatar4.jpg"
              fallback="JR"
            />
          </div>
        </div>
      </section>

      {/* Technical Stack */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold glow-text mb-2">Technology Stack</h2>
            <p className="text-xl text-gray-400">Building on cutting-edge technologies</p>
          </div>

          <Card className="backdrop-blur-md bg-background/40 border-border/40">
            <CardContent className="py-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <TechItem icon={<BarChart3 className="h-8 w-8 text-blue-500" />} name="Sui Blockchain" />
                <TechItem icon={<Lock className="h-8 w-8 text-blue-500" />} name="End-to-End Encryption" />
                <TechItem icon={<Brain className="h-8 w-8 text-blue-500" />} name="AI/ML Integration" />
                <TechItem icon={<Code className="h-8 w-8 text-blue-500" />} name="React & Next.js" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Join Us CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="backdrop-blur-md bg-background/40 border-border/40 overflow-hidden">
            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 z-0"></div>
              <CardContent className="py-16 text-center relative z-10">
                <h2 className="text-3xl font-bold glow-text mb-6">Ready to Transform Scientific Collaboration?</h2>
                <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                  Join LabShareDAO today and become part of a global community dedicated to advancing science through secure, 
                  transparent collaboration.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button size="lg" className="px-8">Join the DAO</Button>
                  <Button size="lg" variant="outline" className="px-8">Contact Us</Button>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <FuturisticCard variant="glass" className="p-6 h-full">
      <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.3 }}>
        <div className="mb-4 bg-blue-500/10 p-3 rounded-full w-fit">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2 gradient-text">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </motion.div>
    </FuturisticCard>
  )
}

function TeamMember({ 
  name, 
  role, 
  bio, 
  avatarSrc, 
  fallback 
}: { 
  name: string, 
  role: string, 
  bio: string, 
  avatarSrc: string, 
  fallback: string 
}) {
  return (
    <FuturisticCard variant="glass" className="p-6">
      <div className="flex flex-col items-center text-center">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage src={avatarSrc} alt={name} />
          <AvatarFallback className="text-xl">{fallback}</AvatarFallback>
        </Avatar>
        <h3 className="text-xl font-semibold gradient-text">{name}</h3>
        <p className="text-blue-400 mb-2">{role}</p>
        <p className="text-gray-400 text-sm">{bio}</p>
        
        <div className="flex mt-4 space-x-3">
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 p-0">
            <Twitter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 p-0">
            <Linkedin className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 p-0">
            <Github className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </FuturisticCard>
  )
}

function TechItem({ icon, name }: { icon: React.ReactNode, name: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-3">
        {icon}
      </div>
      <p className="font-medium">{name}</p>
    </div>
  )
} 