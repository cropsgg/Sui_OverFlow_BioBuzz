"use client"

import type { AppProps } from "next/app"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Disable SSR for Three.js components
const DynamicLoadingScreen = dynamic(() => import("@/components/loading-screen").then((mod) => mod.LoadingScreen), {
  ssr: false,
})

function MyApp({ Component, pageProps }: AppProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate app loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {isLoading && <DynamicLoadingScreen />}
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
