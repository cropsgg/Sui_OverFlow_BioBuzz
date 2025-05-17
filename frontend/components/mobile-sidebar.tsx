"use client"

import type React from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSidebar } from "./sidebar-provider"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

export function MobileSidebar() {
  const pathname = usePathname()
  const { isOpen, close } = useSidebar()

  // Close the sidebar when the route changes
  useEffect(() => {
    close()
  }, [pathname, close])

  return (
    <Sheet open={isOpen} onOpenChange={close}>
      <SheetContent side="left" className="w-[240px] sm:w-[300px]">
        <div className="px-2 py-6">
          <h2 className="text-lg font-bold mb-6">LabShareDAO</h2>
          <NavItem href="/" pathname={pathname}>
            Home
          </NavItem>
          <nav className="flex flex-col space-y-3">
            <NavItem href="/dashboard" pathname={pathname}>
              Dashboard
            </NavItem>
            <NavItem href="/files" pathname={pathname}>
              Files
            </NavItem>
            <NavItem href="/iot" pathname={pathname}>
              IoT Monitoring
            </NavItem>
            <NavItem href="/governance" pathname={pathname}>
              Governance
            </NavItem>
            <NavItem href="/assistant" pathname={pathname}>
              AI Assistant
            </NavItem>
            <NavItem href="/chat" pathname={pathname}>
              Chat
            </NavItem>
            <NavItem href="/settings" pathname={pathname}>
              Settings
            </NavItem>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function NavItem({
  href,
  pathname,
  children,
}: {
  href: string
  pathname: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        "px-3 py-2 rounded-md text-sm font-medium transition-colors",
        pathname === href
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-primary hover:bg-primary/5",
      )}
    >
      {children}
    </Link>
  )
}
