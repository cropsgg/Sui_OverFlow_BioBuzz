"use client"

import { GlowingButton } from "@/components/glowing-button"
import { FuturisticCard } from "@/components/futuristic-card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { Download, Eye, Filter, Lock, Search, Share2, Upload } from "lucide-react"
import { useEffect, useState } from "react"

export default function FilesPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

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
            Encrypted Files
          </motion.h1>
          <motion.p
            className="text-muted-foreground"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Securely share and access research data with end-to-end encryption
          </motion.p>
        </div>
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlowingButton>
            <Upload className="mr-2 h-4 w-4" /> Upload File
          </GlowingButton>
          <GlowingButton variant="outline">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </GlowingButton>
        </motion.div>
      </div>

      <motion.div
        className="flex w-full max-w-sm items-center space-x-2 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Input type="text" placeholder="Search files..." className="glass-card border-blue-500/20" />
        <GlowingButton type="submit" size="icon">
          <Search className="h-4 w-4" />
        </GlowingButton>
      </motion.div>

      <Tabs defaultValue="my-files" className="space-y-4">
        <TabsList className="glass-card">
          <TabsTrigger value="my-files" className="data-[state=active]:gradient-text">
            My Files
          </TabsTrigger>
          <TabsTrigger value="shared" className="data-[state=active]:gradient-text">
            Shared with Me
          </TabsTrigger>
          <TabsTrigger value="recent" className="data-[state=active]:gradient-text">
            Recent
          </TabsTrigger>
        </TabsList>
        <TabsContent value="my-files" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FileCard
              title="CRISPR-Cas9 Results Q2.xlsx"
              type="Excel Spreadsheet"
              size="2.3 MB"
              date="May 15, 2025"
              shared={3}
              encrypted={true}
              delay={0}
            />
            <FileCard
              title="Protein Folding Analysis.pdf"
              type="PDF Document"
              size="8.7 MB"
              date="May 12, 2025"
              shared={5}
              encrypted={true}
              delay={0.1}
            />
            <FileCard
              title="Quantum Computing Simulation.ipynb"
              type="Jupyter Notebook"
              size="1.2 MB"
              date="May 10, 2025"
              shared={2}
              encrypted={true}
              delay={0.2}
            />
            <FileCard
              title="Neural Network Architecture.png"
              type="Image"
              size="4.5 MB"
              date="May 8, 2025"
              shared={0}
              encrypted={true}
              delay={0.3}
            />
            <FileCard
              title="Lab Meeting Notes.docx"
              type="Word Document"
              size="1.8 MB"
              date="May 5, 2025"
              shared={8}
              encrypted={true}
              delay={0.4}
            />
            <FileCard
              title="Research Proposal Draft.pdf"
              type="PDF Document"
              size="3.2 MB"
              date="May 3, 2025"
              shared={4}
              encrypted={true}
              delay={0.5}
            />
          </div>
        </TabsContent>
        <TabsContent value="shared" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FileCard
              title="Genomic Sequencing Data.csv"
              type="CSV File"
              size="12.6 MB"
              date="May 14, 2025"
              shared={1}
              sharedBy="MIT Lab"
              encrypted={true}
              delay={0}
            />
            <FileCard
              title="Antibody Research Results.xlsx"
              type="Excel Spreadsheet"
              size="5.3 MB"
              date="May 11, 2025"
              shared={1}
              sharedBy="Stanford Lab"
              encrypted={true}
              delay={0.1}
            />
            <FileCard
              title="Climate Model Simulation.ipynb"
              type="Jupyter Notebook"
              size="7.8 MB"
              date="May 9, 2025"
              shared={1}
              sharedBy="Berkeley Lab"
              encrypted={true}
              delay={0.2}
            />
          </div>
        </TabsContent>
        <TabsContent value="recent" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FileCard
              title="CRISPR-Cas9 Results Q2.xlsx"
              type="Excel Spreadsheet"
              size="2.3 MB"
              date="May 15, 2025"
              shared={3}
              encrypted={true}
              delay={0}
            />
            <FileCard
              title="Genomic Sequencing Data.csv"
              type="CSV File"
              size="12.6 MB"
              date="May 14, 2025"
              shared={1}
              sharedBy="MIT Lab"
              encrypted={true}
              delay={0.1}
            />
            <FileCard
              title="Protein Folding Analysis.pdf"
              type="PDF Document"
              size="8.7 MB"
              date="May 12, 2025"
              shared={5}
              encrypted={true}
              delay={0.2}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function FileCard({
  title,
  type,
  size,
  date,
  shared,
  sharedBy,
  encrypted,
  delay,
}: {
  title: string
  type: string
  size: string
  date: string
  shared: number
  sharedBy?: string
  encrypted: boolean
  delay: number
}) {
  return (
    <FuturisticCard variant="glass" delay={delay} className="p-0">
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="mr-2">
            <h3 className="text-base font-medium gradient-text">{title}</h3>
            <p className="text-sm text-muted-foreground">{type}</p>
          </div>
          <div className="flex items-center">
            {encrypted && (
              <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                <Lock className="h-4 w-4 text-green-500" />
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <div className="px-4 pb-2">
        <div className="text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Size: {size}</span>
            <span>Uploaded: {date}</span>
          </div>
          {sharedBy && (
            <div className="mt-1">
              <span>Shared by: {sharedBy}</span>
            </div>
          )}
          {shared > 0 && !sharedBy && (
            <div className="mt-1">
              <span>Shared with {shared} labs</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-between p-4 pt-2 border-t border-border/40">
        <div className="flex gap-2">
          <GlowingButton variant="ghost" size="icon" isAnimated={false}>
            <Eye className="h-4 w-4" />
          </GlowingButton>
          <GlowingButton variant="ghost" size="icon" isAnimated={false}>
            <Download className="h-4 w-4" />
          </GlowingButton>
        </div>
        <GlowingButton variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" /> Share
        </GlowingButton>
      </div>
    </FuturisticCard>
  )
}
