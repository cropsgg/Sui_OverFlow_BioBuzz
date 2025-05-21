"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bot,
  Send,
  User,
  X,
  Sparkles,
  Zap,
  Brain,
  Maximize2,
  Minimize2,
  ChevronRight,
  MessageSquare,
  ImageIcon,
  FileText,
  FileAudio,
  FileVideo,
  File,
  Download,
  Copy,
  Share2,
  Trash2,
  Paperclip,
  History,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileUploadPreview } from "@/components/file-upload-preview"
import { AIThinkingAnimation } from "@/components/ai-thinking-animation"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

type MessageType = {
  id: string
  role: "assistant" | "user" | "system"
  content: string
  timestamp: Date
  files?: {
    name: string
    type: string
    size: number
    url?: string
  }[]
  isProcessing?: boolean
}

export default function AssistantPage() {
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<MessageType[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your lab assistant powered by AI. How can I help with your research today?",
      timestamp: new Date(),
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [fullscreen, setFullscreen] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessageToAPI = useCallback(async (message: string, files?: File[]) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: message }],
          // files: files, // (if you want to support files later)
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data.content;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [messages]);

  const handleSend = async () => {
    try {
      if (!input.trim() && attachedFiles.length === 0) return;

      const messageId = Date.now().toString();

      // Add user message
      const fileData = attachedFiles.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
      }));

      setMessages((prev) => [
        ...prev,
        {
          id: messageId,
          role: "user",
          content: input,
          timestamp: new Date(),
          files: fileData.length > 0 ? fileData : undefined,
        },
      ]);

      setInput("");
      setAttachedFiles([]);
      setShowFileUpload(false);
      setIsTyping(true);

      // Get AI response
      const response = await sendMessageToAPI(input, attachedFiles);
      
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `response-${messageId}`,
          role: "assistant",
          content: response,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error in handleSend:", error);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "I apologize, but I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFilesSelected = (files: File[]) => {
    setAttachedFiles((prev) => [...prev, ...files])
  }

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-new",
        role: "assistant",
        content: "Chat cleared. How can I help you with your research today?",
        timestamp: new Date(),
      },
    ])
    toast({
      title: "Chat cleared",
      description: "All previous messages have been removed",
    })
  }

  const exportChat = () => {
    const chatContent = messages
      .map((msg) => `${msg.role.toUpperCase()} (${msg.timestamp.toLocaleString()}): ${msg.content}`)
      .join("\n\n")

    const blob = new Blob([chatContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ai-assistant-chat-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Chat exported",
      description: "Your conversation has been downloaded as a text file",
    })
  }

  if (!mounted) return null

  return (
    <div
      className={cn(
        "container mx-auto py-6 transition-all duration-500",
        fullscreen && "fixed inset-0 z-50 p-0 max-w-none bg-background/95 backdrop-blur-md",
      )}
    >
      <div
        className={cn(
          "flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4",
          fullscreen && "px-6 py-4",
        )}
      >
        <div className="flex items-center">
          <div className="mr-4 bg-primary/10 p-2 rounded-full">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text">AI Lab Assistant</h1>
            <p className="text-muted-foreground">Get insights, summaries, and help with your research</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="ultra-glass-card border-primary/10">
              <DropdownMenuItem onClick={clearChat} className="cursor-pointer">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportChat} className="cursor-pointer">
                <Download className="mr-2 h-4 w-4" />
                Export chat
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <History className="mr-2 h-4 w-4" />
                View history
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Share2 className="mr-2 h-4 w-4" />
                Share conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFullscreen(!fullscreen)}
            className="hover:bg-primary/10"
          >
            {fullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className={cn("flex flex-col", fullscreen && "h-[calc(100vh-120px)]")}>
        <Card
          className={cn(
            "h-[calc(100vh-220px)] flex flex-col ultra-glass-card border-primary/10 shadow-glow",
            fullscreen && "h-full",
          )}
        >
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
            <div className="space-y-6 pt-4">
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isSequential={index > 0 && messages[index - 1].role === message.role}
                />
              ))}

              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex justify-start"
                  >
                    <div className={cn("flex gap-3 max-w-[80%]", "group")}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/20 shadow-glow-sm">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div className="rounded-2xl px-5 py-3 bg-primary/5 text-foreground flex-1 border border-primary/10 shadow-glow-sm">
                        <AIThinkingAnimation />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="p-4 border-t border-primary/10 bg-background/30">
            <AnimatePresence>
              {showFileUpload && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowFileUpload(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <FileUploadPreview onFilesSelected={handleFilesSelected} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {attachedFiles.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-md border border-primary/10 bg-primary/5 p-2 text-xs"
                  >
                    <span className="truncate max-w-[100px]">{file.name}</span>
                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => removeAttachedFile(index)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-end">
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowFileUpload(!showFileUpload)}
                  className={cn(
                    "h-9 w-9 rounded-full border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all",
                    showFileUpload && "bg-primary/20",
                  )}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Ask me anything about your research..."
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value)
                    autoResizeTextarea()
                  }}
                  onKeyDown={handleKeyDown}
                  className="min-h-[60px] max-h-[200px] pr-12 rounded-2xl ultra-glass-input resize-none"
                  rows={1}
                />
                <Button
                  onClick={handleSend}
                  className="absolute right-2 bottom-2 h-8 w-8 rounded-full p-0 bg-primary hover:bg-primary/90"
                  disabled={!input.trim() && attachedFiles.length === 0}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Bottom Suggestions Panel */}
        <div className="mt-4">
          <div
            className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-primary/5 transition-colors"
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            <div className="flex items-center">
              <Sparkles className="h-5 w-5 text-primary mr-2" />
              <h3 className="text-lg font-semibold gradient-text">Suggestions & Examples</h3>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {showSuggestions ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </Button>
          </div>

          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 p-4 ultra-glass-card rounded-lg border-primary/10">
                  {/* Suggested Queries */}
                  <div>
                    <div className="flex items-center mb-3">
                      <MessageSquare className="h-4 w-4 text-primary mr-2" />
                      <h4 className="font-medium">Suggested Queries</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <SuggestedQuery
                        query="Summarize our latest CRISPR results"
                        onClick={() => {
                          setInput("Summarize our latest CRISPR results")
                          textareaRef.current?.focus()
                        }}
                      />
                      <SuggestedQuery
                        query="Analyze protein folding patterns in dataset"
                        onClick={() => {
                          setInput("Analyze protein folding patterns in dataset")
                          textareaRef.current?.focus()
                        }}
                      />
                      <SuggestedQuery
                        query="Suggest next steps for our quantum research"
                        onClick={() => {
                          setInput("Suggest next steps for our quantum research")
                          textareaRef.current?.focus()
                        }}
                      />
                      <SuggestedQuery
                        query="Find similar papers to our current work"
                        onClick={() => {
                          setInput("Find similar papers to our current work")
                          textareaRef.current?.focus()
                        }}
                      />
                      <SuggestedQuery
                        query="Help troubleshoot our experimental setup"
                        onClick={() => {
                          setInput("Help troubleshoot our experimental setup")
                          textareaRef.current?.focus()
                        }}
                      />
                    </div>
                  </div>

                  {/* Upload Examples */}
                  <div>
                    <div className="flex items-center mb-3">
                      <Zap className="h-4 w-4 text-primary mr-2" />
                      <h4 className="font-medium">Upload Examples</h4>
                    </div>
                    <div className="space-y-3 text-sm">
                      <UploadExample
                        icon={<ImageIcon className="h-3.5 w-3.5 text-primary" />}
                        text="Upload microscope images for analysis"
                      />
                      <UploadExample
                        icon={<FileText className="h-3.5 w-3.5 text-primary" />}
                        text="Share research papers for summarization"
                      />
                      <UploadExample
                        icon={<FileText className="h-3.5 w-3.5 text-primary" />}
                        text="Upload data files for pattern recognition"
                      />
                      <UploadExample
                        icon={<FileAudio className="h-3.5 w-3.5 text-primary" />}
                        text="Share audio recordings of experiment notes"
                      />
                    </div>

                    <div className="mt-4 p-3 rounded-xl border border-primary/10 bg-primary/5">
                      <div className="flex items-center mb-2">
                        <Brain className="h-4 w-4 text-primary mr-2" />
                        <h4 className="font-medium text-sm">AI Assistant Capabilities</h4>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1.5">
                        <li className="flex items-start">
                          <ChevronRight className="h-3 w-3 text-primary mr-1 mt-0.5 shrink-0" />
                          <span>Analyze research data and suggest insights</span>
                        </li>
                        <li className="flex items-start">
                          <ChevronRight className="h-3 w-3 text-primary mr-1 mt-0.5 shrink-0" />
                          <span>Summarize scientific papers and articles</span>
                        </li>
                        <li className="flex items-start">
                          <ChevronRight className="h-3 w-3 text-primary mr-1 mt-0.5 shrink-0" />
                          <span>Help troubleshoot experimental setups</span>
                        </li>
                        <li className="flex items-start">
                          <ChevronRight className="h-3 w-3 text-primary mr-1 mt-0.5 shrink-0" />
                          <span>Generate research hypotheses and suggestions</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message, isSequential }: { message: MessageType; isSequential: boolean }) {
  const [showActions, setShowActions] = useState(false)

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (type.startsWith("video/")) return <FileVideo className="h-4 w-4" />
    if (type.startsWith("audio/")) return <FileAudio className="h-4 w-4" />
    if (type === "application/pdf" || type.includes("document") || type.includes("text/"))
      return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date)
  }

  const copyMessage = () => {
    navigator.clipboard.writeText(message.content)
    toast({
      title: "Copied to clipboard",
      description: "Message content has been copied",
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex", message.role === "user" ? "justify-end" : "justify-start", isSequential ? "mt-2" : "mt-6")}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={cn("flex gap-3 max-w-[80%]", message.role === "user" ? "flex-row-reverse" : "", "group")}>
        {!isSequential && (
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shadow-glow-sm",
              message.role === "assistant" ? "bg-primary/20" : "bg-secondary",
            )}
          >
            {message.role === "assistant" ? <Bot className="h-5 w-5 text-primary" /> : <User className="h-5 w-5" />}
          </div>
        )}
        {isSequential && <div className="w-10 flex-shrink-0"></div>}
        <div className="space-y-2">
          {!isSequential && (
            <div
              className={cn(
                "flex items-center text-xs text-muted-foreground",
                message.role === "user" ? "justify-end mr-2" : "ml-1",
              )}
            >
              <span>{message.role === "assistant" ? "AI Assistant" : "You"}</span>
              <span className="mx-2">•</span>
              <span>{formatTimestamp(message.timestamp)}</span>
            </div>
          )}
          <div
            className={cn(
              "rounded-2xl px-5 py-3 shadow-glow-sm",
              message.role === "assistant"
                ? "bg-primary/5 text-foreground border border-primary/10"
                : "bg-primary text-primary-foreground",
            )}
          >
            {message.files && message.files.length > 0 && (
              <div className="mb-3 space-y-2">
                {message.files.map((file, fileIndex) => (
                  <div
                    key={fileIndex}
                    className="flex items-center gap-2 rounded-md border bg-background/20 p-2 text-sm"
                  >
                    {getFileIcon(file.type)}
                    <span className="truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className={cn("flex gap-1", message.role === "user" ? "justify-end" : "")}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full hover:bg-primary/10"
                  onClick={copyMessage}
                >
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                {message.role === "assistant" && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-primary/10">
                    <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-primary/10">
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

function SuggestedQuery({ query, onClick }: { query: string; onClick: () => void }) {
  return (
    <Button
      variant="outline"
      className="w-full justify-start text-left h-auto py-3 px-4 ultra-glass-button"
      onClick={onClick}
    >
      {query}
    </Button>
  )
}

function UploadExample({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="bg-primary/10 p-1.5 rounded-full mt-0.5">{icon}</div>
      <p>{text}</p>
    </div>
  )
}
