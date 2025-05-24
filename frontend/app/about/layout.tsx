import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About | LabShareDAO",
  description: "Learn about LabShareDAO, a decentralized platform for research labs to securely share data and collaborate on the Sui blockchain",
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 