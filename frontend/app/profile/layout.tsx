import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Profile | LabShareDAO",
  description: "Manage your LabShareDAO profile and account settings",
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 