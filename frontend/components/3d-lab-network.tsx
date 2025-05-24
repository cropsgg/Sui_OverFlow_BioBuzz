"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Html } from "@react-three/drei"
import { motion } from "framer-motion"
import * as THREE from "three"

export function LabNetworkModel({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className={`relative h-[400px] w-full rounded-xl ${className}`}
    >
      <Canvas shadows camera={{ position: [0, 0, 15], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <NetworkModel />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.2}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
      <div className="absolute bottom-4 left-4 rounded-md bg-black/50 p-2 backdrop-blur-md">
        <p className="text-xs text-blue-300">
          <span className="font-semibold">Connected Labs:</span> 12
        </p>
        <p className="text-xs text-blue-300">
          <span className="font-semibold">Active Sensors:</span> 87
        </p>
        <p className="text-xs text-blue-300">
          <span className="font-semibold">Data Transfers:</span> 42 GB/day
        </p>
      </div>
    </motion.div>
  )
}

function NetworkModel() {
  const group = useRef<THREE.Group>(null)

  // Lab locations
  const labs = [
    { name: "MIT Lab", position: [0, 0, 0], color: "#3b82f6", size: 1.2 },
    { name: "Harvard Lab", position: [5, 3, -2], color: "#8b5cf6", size: 1 },
    { name: "Stanford Lab", position: [-5, -2, 3], color: "#ec4899", size: 1 },
    { name: "Berkeley Lab", position: [4, -3, 4], color: "#10b981", size: 1 },
    { name: "Oxford Lab", position: [-4, 4, 2], color: "#f59e0b", size: 0.9 },
    { name: "Tokyo Lab", position: [2, 5, -3], color: "#6366f1", size: 0.85 },
    { name: "Berlin Lab", position: [-6, 1, -3], color: "#ef4444", size: 0.8 },
    { name: "Paris Lab", position: [6, -1, -4], color: "#8b5cf6", size: 0.75 },
    { name: "Sydney Lab", position: [-3, -5, -2], color: "#84cc16", size: 0.7 },
    { name: "Singapore Lab", position: [1, -4, -5], color: "#06b6d4", size: 0.7 },
    { name: "Toronto Lab", position: [-2, 2, 6], color: "#f43f5e", size: 0.7 },
    { name: "Mumbai Lab", position: [3, -2, -6], color: "#eab308", size: 0.7 },
  ]

  // Generate connections between labs
  const connections: { start: number[]; end: number[]; intensity: number }[] = []

  for (let i = 0; i < labs.length; i++) {
    // Connect core lab to all others
    if (i === 0) {
      for (let j = 1; j < labs.length; j++) {
        connections.push({
          start: labs[i].position,
          end: labs[j].position,
          intensity: 1,
        })
      }
    } else {
      // Connect to 2-3 random other labs
      const numConnections = 2 + Math.floor(Math.random() * 2)
      for (let j = 0; j < numConnections; j++) {
        let targetIndex
        do {
          targetIndex = Math.floor(Math.random() * labs.length)
        } while (
          targetIndex === i ||
          connections.some(
            (c) =>
              (c.start === labs[i].position && c.end === labs[targetIndex].position) ||
              (c.start === labs[targetIndex].position && c.end === labs[i].position),
          )
        )

        connections.push({
          start: labs[i].position,
          end: labs[targetIndex].position,
          intensity: 0.5 + Math.random() * 0.5,
        })
      }
    }
  }

  return (
    <group ref={group}>
      {labs.map((lab, index) => (
        <Lab
          key={index}
          name={lab.name}
          position={lab.position as [number, number, number]}
          color={lab.color}
          size={lab.size}
        />
      ))}

      {connections.map((connection, index) => (
        <Connection
          key={index}
          start={connection.start as [number, number, number]}
          end={connection.end as [number, number, number]}
          intensity={connection.intensity}
        />
      ))}

      <DataPackets count={50} connections={connections} />
    </group>
  )
}

function Lab({
  name,
  position,
  color,
  size = 1,
}: {
  name: string
  position: [number, number, number]
  color: string
  size?: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Subtle breathing animation
      const breathe = Math.sin(clock.getElapsedTime() * 1.5) * 0.05 + 1
      meshRef.current.scale.set(size * breathe, size * breathe, size * breathe)
    }
  })

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 1 : 0.5}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      <Html>
        <div
          className={`absolute whitespace-nowrap rounded-md bg-black/70 px-2 py-1 text-xs backdrop-blur-sm transition-opacity ${
            hovered ? "opacity-100" : "opacity-0"
          }`}
          style={{ transform: "translate(-50%, -130%)" }}
        >
          {name}
        </div>
      </Html>
    </group>
  )
}

function Connection({
  start,
  end,
  intensity = 1,
}: {
  start: [number, number, number]
  end: [number, number, number]
  intensity?: number
}) {
  const lineMaterialRef = useRef<THREE.LineBasicMaterial>(null)

  useFrame(({ clock }) => {
    if (lineMaterialRef.current) {
      // Pulsating effect
      const pulse = Math.sin(clock.getElapsedTime() * 2) * 0.3 + 0.7
      lineMaterialRef.current.opacity = pulse * intensity
    }
  })

  return (
    <line>
      <bufferGeometry
        attach="geometry"
        setFromPoints={[new THREE.Vector3(...start), new THREE.Vector3(...end)].map((v) => v as THREE.Vector3)}
      />
      <lineBasicMaterial
        ref={lineMaterialRef}
        attach="material"
        color="#3b82f6"
        linewidth={1}
        opacity={intensity}
        transparent
      />
    </line>
  )
}

function DataPackets({
  count = 30,
  connections,
}: { count?: number; connections: { start: number[]; end: number[]; intensity: number }[] }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = new THREE.Object3D()
  const particles = useRef<
    {
      startPos: THREE.Vector3
      endPos: THREE.Vector3
      progress: number
      speed: number
      size: number
    }[]
  >([])

  useEffect(() => {
    if (!particles.current.length && connections.length > 0) {
      for (let i = 0; i < count; i++) {
        // Select a random connection
        const connection = connections[Math.floor(Math.random() * connections.length)]

        // Create data packet moving along this connection
        const startPos = new THREE.Vector3(...(connection.start as [number, number, number]))
        const endPos = new THREE.Vector3(...(connection.end as [number, number, number]))

        particles.current.push({
          startPos,
          endPos,
          progress: Math.random(), // Random initial position along the connection
          speed: 0.005 + Math.random() * 0.01,
          size: 0.1 + Math.random() * 0.1,
        })
      }
    }
  }, [count, connections])

  useFrame(() => {
    if (mesh.current && particles.current.length > 0) {
      // Update particles
      for (let i = 0; i < particles.current.length; i++) {
        const particle = particles.current[i]

        // Update progress
        particle.progress += particle.speed

        // Reset if reached the end
        if (particle.progress >= 1) {
          particle.progress = 0

          // Optionally, switch to a new random connection
          if (Math.random() > 0.7) {
            const connection = connections[Math.floor(Math.random() * connections.length)]
            particle.startPos = new THREE.Vector3(...(connection.start as [number, number, number]))
            particle.endPos = new THREE.Vector3(...(connection.end as [number, number, number]))
          }
        }

        // Calculate current position along the path
        const currentPos = particle.startPos.clone().lerp(particle.endPos, particle.progress)

        // Update instance
        dummy.position.copy(currentPos)
        dummy.scale.set(particle.size, particle.size, particle.size)
        dummy.updateMatrix()
        mesh.current.setMatrixAt(i, dummy.matrix)
      }
      mesh.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} castShadow receiveShadow>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={1} transparent opacity={0.7} />
    </instancedMesh>
  )
}
