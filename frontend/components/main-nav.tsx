"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/sidebar-provider"
import { Menu } from "lucide-react"

export function MainNav() {
  const pathname = usePathname()
  const { toggle } = useSidebar()

  return (
    <div className="flex items-center">
      <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={toggle}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      <Link href="/" className="mr-6 flex items-center space-x-2">
        <span className="hidden font-bold sm:inline-block text-xl">LabShareDAO</span>
      </Link>

      <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
        <Link
          href="/"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/" ? "text-primary" : "text-muted-foreground",
          )}
        >
          Home
        </Link>
        <Link
          href="/dashboard"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/dashboard" ? "text-primary" : "text-muted-foreground",
          )}
        >
          Dashboard
        </Link>
        <Link
          href="/files"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/files" ? "text-primary" : "text-muted-foreground",
          )}
        >
          Files
        </Link>
        <Link
          href="/iot"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/iot" ? "text-primary" : "text-muted-foreground",
          )}
        >
          IoT Monitoring
        </Link>
        <Link
          href="/governance"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/governance" ? "text-primary" : "text-muted-foreground",
          )}
        >
          Governance
        </Link>
        <Link
          href="/assistant"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/assistant" ? "text-primary" : "text-muted-foreground",
          )}
        >
          AI Assistant
        </Link>
      </nav>
    </div>
  )
}
