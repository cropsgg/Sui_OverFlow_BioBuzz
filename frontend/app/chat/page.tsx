"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { Send } from "lucide-react"
import { useEffect, useState } from "react"

export default function ChatPage() {
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState("")
  const [activeChat, setActiveChat] = useState("general")

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSend = () => {
    if (!input.trim()) return
    setInput("")
    // In a real app, this would send the message to the server
  }

  if (!mounted) return null

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lab Chat</h1>
          <p className="text-muted-foreground">
            Secure, end-to-end encrypted communication with your research partners
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card className="h-[calc(100vh-220px)]">
            <CardContent className="p-4">
              <Input placeholder="Search chats..." className="mb-4" />
              <div className="space-y-2">
                <ChatItem
                  name="General"
                  lastMessage="Dr. Chen: Just uploaded the new dataset"
                  time="2m ago"
                  unread={2}
                  active={activeChat === "general"}
                  onClick={() => setActiveChat("general")}
                />
                <ChatItem
                  name="Quantum Research"
                  lastMessage="Dr. Williams: Let's discuss the simulation results"
                  time="10m ago"
                  unread={0}
                  active={activeChat === "quantum"}
                  onClick={() => setActiveChat("quantum")}
                />
                <ChatItem
                  name="Genomics Team"
                  lastMessage="Dr. Smith: The CRISPR results look promising"
                  time="1h ago"
                  unread={5}
                  active={activeChat === "genomics"}
                  onClick={() => setActiveChat("genomics")}
                />
                <ChatItem
                  name="MIT Collaboration"
                  lastMessage="Dr. Johnson: When can we schedule the next meeting?"
                  time="3h ago"
                  unread={0}
                  active={activeChat === "mit"}
                  onClick={() => setActiveChat("mit")}
                />
                <ChatItem
                  name="Stanford Lab"
                  lastMessage="Dr. Garcia: Thanks for sharing your protocol"
                  time="Yesterday"
                  unread={0}
                  active={activeChat === "stanford"}
                  onClick={() => setActiveChat("stanford")}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Card className="h-[calc(100vh-220px)] flex flex-col">
            <Tabs defaultValue="chat" className="flex-1 flex flex-col">
              <div className="border-b px-4 py-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">
                    {activeChat === "general"
                      ? "General"
                      : activeChat === "quantum"
                        ? "Quantum Research"
                        : activeChat === "genomics"
                          ? "Genomics Team"
                          : activeChat === "mit"
                            ? "MIT Collaboration"
                            : "Stanford Lab"}
                  </h3>
                  <TabsList>
                    <TabsTrigger value="chat">Chat</TabsTrigger>
                    <TabsTrigger value="files">Files</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0">
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    <ChatMessage
                      name="Dr. Chen"
                      avatar="/abstract-avatar.png"
                      message="Hey everyone, I've just uploaded the new dataset to the shared repository. You can access it now."
                      time="2:30 PM"
                      delay={0}
                    />
                    <ChatMessage
                      name="Dr. Williams"
                      avatar="/abstract-avatar-2.png"
                      message="Thanks Chen! I'll take a look at it right away. Did you include the metadata for the samples?"
                      time="2:32 PM"
                      delay={0.1}
                    />
                    <ChatMessage
                      name="Dr. Chen"
                      avatar="/abstract-avatar.png"
                      message="Yes, everything is included in the metadata.json file. Let me know if you need anything else."
                      time="2:33 PM"
                      delay={0.2}
                    />
                    <ChatMessage
                      name="Dr. Smith"
                      avatar="/abstract-avatar-3.png"
                      message="Great work! I'm particularly interested in the CRISPR results. The preliminary analysis looks promising."
                      time="2:35 PM"
                      delay={0.3}
                    />
                    <ChatMessage
                      name="Dr. Johnson"
                      avatar="/abstract-avatar-4.png"
                      message="When can we schedule the next meeting to discuss these findings? I think we should involve the Stanford team as well."
                      time="2:38 PM"
                      delay={0.4}
                    />
                    <ChatMessage
                      name="You"
                      avatar="/abstract-user-avatar.png"
                      message="How about next Tuesday at 2 PM? I'll send a calendar invite to everyone including the Stanford team."
                      time="2:40 PM"
                      isUser={true}
                      delay={0.5}
                    />
                  </div>
                </div>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input placeholder="Type a message..." value={input} onChange={(e) => setInput(e.target.value)} />
                    <Button onClick={handleSend}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="files" className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  <h3 className="font-semibold">Shared Files</h3>
                  <div className="grid gap-2">
                    <FileItem
                      name="CRISPR-Cas9 Results Q2.xlsx"
                      size="2.3 MB"
                      uploadedBy="Dr. Chen"
                      time="Today, 2:30 PM"
                    />
                    <FileItem
                      name="Protein Folding Analysis.pdf"
                      size="8.7 MB"
                      uploadedBy="Dr. Williams"
                      time="Yesterday, 4:15 PM"
                    />
                    <FileItem name="Lab Meeting Notes.docx" size="1.8 MB" uploadedBy="Dr. Smith" time="May 12, 2025" />
                    <FileItem name="Research Proposal Draft.pdf" size="3.2 MB" uploadedBy="You" time="May 10, 2025" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="members" className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  <h3 className="font-semibold">Chat Members</h3>
                  <div className="grid gap-2">
                    <MemberItem
                      name="Dr. Chen"
                      role="Principal Investigator"
                      lab="MIT Quantum Computing Lab"
                      avatar="/abstract-avatar.png"
                    />
                    <MemberItem
                      name="Dr. Williams"
                      role="Senior Researcher"
                      lab="Berkeley Quantum Lab"
                      avatar="/abstract-avatar-2.png"
                    />
                    <MemberItem
                      name="Dr. Smith"
                      role="Research Scientist"
                      lab="Harvard Medical School"
                      avatar="/abstract-avatar-3.png"
                    />
                    <MemberItem
                      name="Dr. Johnson"
                      role="Associate Professor"
                      lab="MIT Quantum Computing Lab"
                      avatar="/abstract-avatar-4.png"
                    />
                    <MemberItem
                      name="You"
                      role="Research Lead"
                      lab="Your Lab"
                      avatar="/abstract-user-avatar.png"
                      isYou={true}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ChatItem({
  name,
  lastMessage,
  time,
  unread,
  active,
  onClick,
}: {
  name: string
  lastMessage: string
  time: string
  unread: number
  active: boolean
  onClick: () => void
}) {
  return (
    <div className={`p-3 rounded-lg cursor-pointer ${active ? "bg-primary/10" : "hover:bg-muted"}`} onClick={onClick}>
      <div className="flex justify-between items-start">
        <h4 className="font-medium">{name}</h4>
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>
      <p className="text-sm text-muted-foreground truncate">{lastMessage}</p>
      {unread > 0 && (
        <div className="flex justify-end mt-1">
          <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">{unread}</span>
        </div>
      )}
    </div>
  )
}

function ChatMessage({
  name,
  avatar,
  message,
  time,
  isUser = false,
  delay,
}: {
  name: string
  avatar: string
  message: string
  time: string
  isUser?: boolean
  delay: number
}) {
  return (
    <motion.div
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
        <img src={avatar || "/placeholder.svg"} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className={`max-w-[80%] ${isUser ? "text-right" : ""}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-medium ${isUser ? "ml-auto" : ""}`}>{name}</span>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
        <div className={`rounded-lg px-4 py-2 ${isUser ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </motion.div>
  )
}

function FileItem({
  name,
  size,
  uploadedBy,
  time,
}: {
  name: string
  size: string
  uploadedBy: string
  time: string
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div>
        <h4 className="font-medium">{name}</h4>
        <p className="text-xs text-muted-foreground">
          {size} • Uploaded by {uploadedBy} • {time}
        </p>
      </div>
      <Button variant="outline" size="sm">
        Download
      </Button>
    </div>
  )
}

function MemberItem({
  name,
  role,
  lab,
  avatar,
  isYou = false,
}: {
  name: string
  role: string
  lab: string
  avatar: string
  isYou?: boolean
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border">
      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
        <img src={avatar || "/placeholder.svg"} alt={name} className="w-full h-full object-cover" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{name}</h4>
          {isYou && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">You</span>}
        </div>
        <p className="text-xs text-muted-foreground">
          {role} • {lab}
        </p>
      </div>
    </div>
  )
}
