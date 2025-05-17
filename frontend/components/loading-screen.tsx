"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import * as THREE from "three"

export function LoadingScreen() {
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 3000)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 1
      })
    }, 25)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])

  if (!isLoading) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: isLoading ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-screen-xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="mb-2 text-5xl font-extrabold tracking-tight sm:text-6xl gradient-text">
            LabShare<span className="text-blue-500">DAO</span>
          </h1>
          <p className="text-muted-foreground">Decentralized Research Collaboration Platform</p>
        </motion.div>

        <div className="mx-auto mb-8 h-80 w-80">
          <Canvas shadows>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} castShadow />
            <Blockchain progress={progress} />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate
              autoRotateSpeed={5}
              maxPolarAngle={Math.PI / 2}
              minPolarAngle={Math.PI / 2}
            />
            <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={50} />
          </Canvas>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mx-auto mb-6 h-2 w-64 overflow-hidden rounded-full bg-gray-700"
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-sm font-medium text-muted-foreground"
        >
          {progress === 100 ? (
            <div className="text-primary">Ready to revolutionize research collaboration</div>
          ) : (
            <div className="flex items-center justify-center gap-1">
              <span>Loading secure environment</span>
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

function Blockchain({ progress }: { progress: number }) {
  const numBlocks = 7
  const activeBlocks = Math.ceil((progress / 100) * numBlocks)

  return (
    <group>
      {Array.from({ length: numBlocks }).map((_, index) => (
        <Block
          key={index}
          position={[
            Math.sin((index / numBlocks) * Math.PI * 2) * 2.5,
            Math.cos((index / numBlocks) * Math.PI * 2) * 2.5,
            0,
          ]}
          active={index < activeBlocks}
          index={index}
        />
      ))}
      {Array.from({ length: numBlocks }).map((_, index) => {
        if (index === numBlocks - 1) return null
        return (
          <Connection
            key={`connection-${index}`}
            start={[
              Math.sin((index / numBlocks) * Math.PI * 2) * 2.5,
              Math.cos((index / numBlocks) * Math.PI * 2) * 2.5,
              0,
            ]}
            end={[
              Math.sin(((index + 1) / numBlocks) * Math.PI * 2) * 2.5,
              Math.cos(((index + 1) / numBlocks) * Math.PI * 2) * 2.5,
              0,
            ]}
            active={index < activeBlocks - 1}
          />
        )
      })}
      {/* Connect last to first */}
      <Connection
        key="connection-last"
        start={[
          Math.sin(((numBlocks - 1) / numBlocks) * Math.PI * 2) * 2.5,
          Math.cos(((numBlocks - 1) / numBlocks) * Math.PI * 2) * 2.5,
          0,
        ]}
        end={[Math.sin(0) * 2.5, Math.cos(0) * 2.5, 0]}
        active={activeBlocks === numBlocks}
      />
    </group>
  )
}

function Block({ position, active, index }: { position: [number, number, number]; active: boolean; index: number }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial
        color={active ? "#3b82f6" : "#1e293b"}
        emissive={active ? "#3b82f6" : "#000000"}
        emissiveIntensity={active ? 0.5 : 0}
        roughness={0.3}
        metalness={0.8}
      />
    </mesh>
  )
}

function Connection({
  start,
  end,
  active,
}: {
  start: [number, number, number]
  end: [number, number, number]
  active: boolean
}) {
  const material = new THREE.LineBasicMaterial({
    color: active ? "#3b82f6" : "#1e293b",
    opacity: active ? 1 : 0.4,
    transparent: true,
  })

  const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)]
  const geometry = new THREE.BufferGeometry().setFromPoints(points)

  return <line geometry={geometry} material={material} />
}
