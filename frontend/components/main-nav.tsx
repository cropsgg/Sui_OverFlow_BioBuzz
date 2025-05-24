"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/sidebar-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  FileText,
  Database,
  Settings,
  MessageCircle,
  Bot,
  Upload,
  Shield,
  ChevronDown,
  Users,
  Wallet,
  TrendingUp,
  Activity,
  Vote,
  Zap,
  FlaskConical,
  Menu,
  Brain,
  Microscope
} from "lucide-react"

export function MainNav() {
  const pathname = usePathname()
  const { toggle } = useSidebar()

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      description: "DAO overview and analytics"
    },
    {
      title: "DAO Governance",
      icon: Shield,
      description: "Decentralized governance tools",
      items: [
        {
          title: "Proposals",
          href: "/governance",
          icon: Vote,
          description: "Create and vote on proposals",
          badge: "New"
        },
        {
          title: "Members",
          href: "/dashboard?tab=members",
          icon: Users,
          description: "View and manage DAO members"
        },
        {
          title: "Treasury",
          href: "/dashboard?tab=treasury",
          icon: Wallet,
          description: "DAO treasury and funding"
        },
        {
          title: "Admin Panel",
          href: "/dashboard?tab=admin",
          icon: Settings,
          description: "Administrative controls"
        }
      ]
    },
    {
      title: "Data & Research",
      icon: Database,
      description: "IoT data and research tools",
      items: [
        {
          title: "Data Management",
          href: "/iot", 
          icon: Database,
          description: "Submit and manage IoT sensor data"
        },
        {
          title: "Shelf Life Predictor",
          href: "/shelf-life",
          icon: FlaskConical,
          description: "Predict biological sample shelf life",
          badge: "New"
        },
        {
          title: "Data Records",
          href: "/dashboard?tab=data",
          icon: TrendingUp,
          description: "View data submissions and alerts"
        },
        {
          title: "Analytics",
          href: "/dashboard?tab=overview",
          icon: Activity,
          description: "Data analytics and insights"
        }
      ]
    },
    {
      title: "AI Tools",
      icon: Bot,
      description: "AI-powered research tools",
      items: [
        {
          title: "Chat Assistant",
          href: "/chat",
          icon: MessageCircle,
          description: "AI research assistant"
        },
        {
          title: "AI Assistant",
          href: "/assistant",
          icon: Bot,
          description: "Advanced AI tools and analysis"
        },
        {
          title: "Biomedical Analysis",
          href: "/biomedical-analysis",
          icon: Brain,
          description: "AI-powered biomedical text analysis",
          badge: "New"
        },
        {
          title: "Research Insights",
          href: "/research-insights",
          icon: Microscope,
          description: "DAO data analysis with biomedical AI",
          badge: "New"
        }
      ]
    },
    {
      title: "Files",
      href: "/files",
      icon: Upload,
      description: "File sharing and collaboration"
    }
  ]

  const renderNavItem = (item: any) => {
    if (item.items) {
      return (
        <DropdownMenu key={item.title}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                item.items.some((subItem: any) => pathname.startsWith(subItem.href.split('?')[0])) 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="flex items-center gap-2">
              <item.icon className="h-4 w-4" />
              {item.title}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {item.items.map((subItem: any) => (
              <DropdownMenuItem key={subItem.href} asChild>
                <Link
                  href={subItem.href} 
                  className={cn(
                    "flex items-center gap-2 w-full cursor-pointer",
                    pathname === subItem.href.split('?')[0] && "bg-muted"
                  )}
                >
                  <subItem.icon className="h-4 w-4" />
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{subItem.title}</span>
                      {subItem.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {subItem.badge}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {subItem.description}
                    </span>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
          pathname === item.href ? "text-primary" : "text-muted-foreground"
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.title}
        {item.badge && (
          <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
            {item.badge}
          </Badge>
        )}
      </Link>
    )
  }

  return (
    <div className="flex items-center w-full">
      {/* Mobile Menu Toggle */}
      <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={toggle}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold gradient-text">LabShareDAO</span>
      </Link>

      {/* Navigation Items */}
      <nav className="hidden md:flex items-center gap-1 ml-6">
        {navItems.map(renderNavItem)}
      </nav>

      {/* Status Indicators */}
      <div className="hidden lg:flex items-center gap-2 ml-auto">
        <Badge variant="outline" className="gap-1">
          <Activity className="h-3 w-3" />
          <span className="text-xs">Testnet</span>
        </Badge>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>
    </div>
  )
}
