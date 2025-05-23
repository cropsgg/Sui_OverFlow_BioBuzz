import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Change Password | LabShareDAO",
  description: "Update your LabShareDAO account password",
}

export default function ChangePasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 