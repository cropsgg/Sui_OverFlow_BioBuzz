"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { Send, Plus, AlertCircle } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { io, Socket } from "socket.io-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Define message type for chat
interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  avatar: string;
  roomId: string;
}

// Define chatroom type
interface Chatroom {
  id: string;
  name: string;
  description: string;
  lastMessage: string;
  time: string;
  unread: number;
}

export default function ChatPage() {
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState("")
  const [activeChat, setActiveChat] = useState("general")
  const [username, setUsername] = useState("")
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatrooms, setChatrooms] = useState<Chatroom[]>([
    {
      id: "general",
      name: "General",
      description: "General discussion for all researchers",
      lastMessage: "Loading messages...",
      time: "",
      unread: 0
    },
    {
      id: "quantum",
      name: "Quantum Research",
      description: "Discussions about quantum computing research",
      lastMessage: "Loading messages...",
      time: "",
      unread: 0
    },
    {
      id: "genomics",
      name: "Genomics Team",
      description: "CRISPR and genomics research discussions",
      lastMessage: "Loading messages...",
      time: "",
      unread: 0
    },
    {
      id: "mit",
      name: "MIT Collaboration",
      description: "Collaboration with MIT research team",
      lastMessage: "Loading messages...",
      time: "",
      unread: 0
    },
    {
      id: "stanford",
      name: "Stanford Lab",
      description: "Collaboration with Stanford research team",
      lastMessage: "Loading messages...",
      time: "",
      unread: 0
    }
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')
  
  useEffect(() => {
    setMounted(true)
    
    // Initialize socket connection
    const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001';
    
    socketRef.current = io(SOCKET_SERVER_URL);
    
    // Socket event listeners
    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
      setConnectionStatus('connected');
      toast({
        title: "Connected to chat server",
        description: "You're now connected to the real-time chat server",
      });
    });
    
    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setConnectionStatus('disconnected');
      toast({
        title: "Disconnected from chat server",
        description: "Connection to the chat server was lost. Trying to reconnect...",
        variant: "destructive"
      });
    });
    
    socketRef.current.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionStatus('disconnected');
      toast({
        title: "Connection error",
        description: "Could not connect to the chat server. Please try again later.",
        variant: "destructive"
      });
    });
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);
  
  // Join room when username is set and active chat changes
  useEffect(() => {
    if (username && socketRef.current && connectionStatus === 'connected') {
      // Join the active chat room
      socketRef.current.emit('joinRoom', { username, roomId: activeChat });
      
      // Get room history
      socketRef.current.emit('getRoomHistory', { roomId: activeChat });
      
      // Listen for room history
      socketRef.current.on('roomHistory', (data: { messages: ChatMessage[] }) => {
        // Convert string timestamps to Date objects
        const formattedMessages = data.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(formattedMessages);
      });
      
      // Listen for new messages
      socketRef.current.on('message', (message: ChatMessage) => {
        // Convert string timestamp to Date object
        const formattedMessage = {
          ...message,
          timestamp: new Date(message.timestamp)
        };
        
        setMessages(prev => [...prev, formattedMessage]);
        
        // Update chatroom last message if it's for the current room
        if (message.roomId === activeChat) {
          updateChatroomLastMessage(message.roomId, `${message.username}: ${message.message}`);
        } else {
          // Increment unread count for other rooms
          incrementUnreadCount(message.roomId);
        }
      });
      
      // Listen for user joined notifications
      socketRef.current.on('userJoined', (data: { username: string, roomId: string }) => {
        if (data.roomId === activeChat && data.username !== username) {
          toast({
            title: "User joined",
            description: `${data.username} joined the chat`,
          });
        }
      });
      
      // Listen for user left notifications
      socketRef.current.on('userLeft', (data: { username: string, roomId: string }) => {
        if (data.roomId === activeChat && data.username !== username) {
          toast({
            title: "User left",
            description: `${data.username} left the chat`,
          });
        }
      });
      
      // Clean up listeners when changing rooms
      return () => {
        if (socketRef.current) {
          socketRef.current.off('roomHistory');
          socketRef.current.off('message');
          socketRef.current.off('userJoined');
          socketRef.current.off('userLeft');
          
          // Leave the current room
          socketRef.current.emit('leaveRoom', { username, roomId: activeChat });
        }
      };
    }
  }, [username, activeChat, connectionStatus]);

  // Scroll to bottom of messages when new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const updateChatroomLastMessage = (roomId: string, lastMessage: string) => {
    setChatrooms(prev => 
      prev.map(room => 
        room.id === roomId 
          ? { 
              ...room, 
              lastMessage,
              time: "Just now",
            } 
          : room
      )
    );
  };
  
  const incrementUnreadCount = (roomId: string) => {
    setChatrooms(prev => 
      prev.map(room => 
        room.id === roomId 
          ? { ...room, unread: room.unread + 1 } 
          : room
      )
    );
  };

  const handleSend = () => {
    if (!input.trim() || !username || !socketRef.current || connectionStatus !== 'connected') return;
    
    // Create new message
    const newMessage = {
      id: Date.now().toString(),
      username,
      message: input.trim(),
      timestamp: new Date(),
      avatar: "/abstract-user-avatar.png",
      roomId: activeChat
    };
    
    // Send message to server
    socketRef.current.emit('sendMessage', newMessage);
    
    // Clear input
    setInput("");
  };

  const handleUsernameSubmit = () => {
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to join the chat",
        variant: "destructive"
      });
      return;
    }
    
    setUsernameDialogOpen(false);
    toast({
      title: "Welcome to Lab Chat",
      description: `You've joined as ${username}`,
    });
  };

  const handleChatroomChange = (chatroomId: string) => {
    setActiveChat(chatroomId);
    
    // Mark as read
    setChatrooms(prev => 
      prev.map(room => 
        room.id === chatroomId 
          ? { ...room, unread: 0 } 
          : room
      )
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!mounted) return null;

  return (
    <div className="container mx-auto py-6">
      {/* Username Dialog */}
      <Dialog open={usernameDialogOpen} onOpenChange={setUsernameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter your username</DialogTitle>
            <DialogDescription>
              Please enter a username to join the chat rooms.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="col-span-3"
                placeholder="Enter your username"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUsernameSubmit();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUsernameSubmit}>Join Chat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lab Chat</h1>
          <p className="text-muted-foreground">
            Secure, end-to-end encrypted communication with your research partners
          </p>
        </div>
        <div className="flex items-center gap-4">
          {connectionStatus !== 'connected' && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {connectionStatus === 'connecting' ? 'Connecting to server...' : 'Disconnected from server'}
              </AlertDescription>
            </Alert>
          )}
          {username && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                <span className="font-medium text-sm">{username.charAt(0).toUpperCase()}</span>
              </div>
              <span className="font-medium">Logged in as {username}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card className="h-[calc(100vh-220px)]">
            <CardContent className="p-4">
              <Input placeholder="Search chats..." className="mb-4" />
              <div className="space-y-2">
                {chatrooms.map(room => (
                  <ChatItem
                    key={room.id}
                    name={room.name}
                    lastMessage={room.lastMessage}
                    time={room.time}
                    unread={room.unread}
                    active={activeChat === room.id}
                    onClick={() => handleChatroomChange(room.id)}
                  />
                ))}
                <Button 
                  variant="outline" 
                  className="w-full mt-4 flex items-center gap-2"
                  onClick={() => {
                    toast({
                      title: "Coming soon",
                      description: "Creating new chat rooms will be available in a future update",
                    });
                  }}
                >
                  <Plus className="h-4 w-4" /> Create New Chat Room
                </Button>
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
                    {chatrooms.find(room => room.id === activeChat)?.name || "Chat"}
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
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <ChatMessage
                          key={msg.id}
                          name={msg.username}
                          avatar={msg.avatar}
                          message={msg.message}
                          time={formatTime(msg.timestamp)}
                          isUser={msg.username === username}
                          delay={0}
                        />
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input 
                      placeholder={connectionStatus !== 'connected' ? "Connecting to server..." : "Type a message..."} 
                      value={input} 
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      disabled={!username || connectionStatus !== 'connected'}
                    />
                    <Button 
                      onClick={handleSend} 
                      disabled={!username || connectionStatus !== 'connected'}
                    >
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
                    {username && (
                      <MemberItem
                        name={username}
                        role="Research Lead"
                        lab="Your Lab"
                        avatar="/abstract-user-avatar.png"
                        isYou={true}
                      />
                    )}
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
