"use client"

import dynamic from "next/dynamic"

// Disable SSR for Three.js components
const DynamicLoadingScreen = dynamic(
  () => import("@/components/loading-screen").then((mod) => mod.LoadingScreen),
  {
    ssr: false,
  }
)

export function ClientLoadingScreen() {
  return <DynamicLoadingScreen />
} 