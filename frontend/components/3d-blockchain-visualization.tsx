"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Text, OrbitControls, MeshWobbleMaterial } from "@react-three/drei"
import { motion } from "framer-motion"
import * as THREE from "three"

export function BlockchainVisualization({ className = "" }: { className?: string }) {
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
      <Canvas shadows camera={{ position: [0, 0, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <BlockchainStructure />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={1}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
      <div className="absolute bottom-4 left-4 rounded-md bg-black/50 p-2 backdrop-blur-md">
        <p className="text-xs text-blue-300">
          <span className="font-semibold">Active Nodes:</span> 42
        </p>
        <p className="text-xs text-blue-300">
          <span className="font-semibold">Transactions:</span> 1,287
        </p>
        <p className="text-xs text-blue-300">
          <span className="font-semibold">Consensus:</span> 99.8%
        </p>
      </div>
    </motion.div>
  )
}

function BlockchainStructure() {
  const group = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.y = clock.getElapsedTime() * 0.1
    }
  })

  // Generate random positions for blocks
  const blockPositions = Array.from({ length: 20 }, (_, i) => {
    const radius = 5 + Math.random() * 2
    const angle = (i / 20) * Math.PI * 2
    const x = Math.cos(angle) * radius
    const y = (Math.random() - 0.5) * 4
    const z = Math.sin(angle) * radius
    return [x, y, z]
  })

  // Generate connections between blocks
  const connections: { start: number[]; end: number[] }[] = []
  for (let i = 0; i < blockPositions.length; i++) {
    // Connect to next
    if (i < blockPositions.length - 1) {
      connections.push({
        start: blockPositions[i],
        end: blockPositions[i + 1],
      })
    }

    // Connect some random blocks
    if (Math.random() > 0.7) {
      const randomIndex = Math.floor(Math.random() * blockPositions.length)
      if (randomIndex !== i) {
        connections.push({
          start: blockPositions[i],
          end: blockPositions[randomIndex],
        })
      }
    }
  }

  return (
    <group ref={group}>
      {blockPositions.map((position, index) => (
        <Block key={index} position={position as [number, number, number]} index={index} />
      ))}
      {connections.map((connection, index) => (
        <Connection
          key={index}
          start={connection.start as [number, number, number]}
          end={connection.end as [number, number, number]}
        />
      ))}
      <DataParticles count={200} />
    </group>
  )
}

function Block({ position, index }: { position: [number, number, number]; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const isSpecial = index % 5 === 0

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Subtle floating animation
      meshRef.current.position.y += Math.sin(clock.getElapsedTime() * 2 + index) * 0.0015
    }
  })

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      {isSpecial ? (
        <MeshWobbleMaterial
          color="#3b82f6"
          emissive="#1d4ed8"
          emissiveIntensity={0.5}
          factor={0.2}
          speed={1}
          roughness={0.3}
          metalness={0.8}
        />
      ) : (
        <meshStandardMaterial
          color="#4b5563"
          emissive="#1e293b"
          emissiveIntensity={0.2}
          roughness={0.5}
          metalness={0.6}
        />
      )}
      {isSpecial && (
        <Text
          position={[0, 1.2, 0]}
          fontSize={0.3}
          color="#3b82f6"
          anchorX="center"
          anchorY="middle"
          maxWidth={2}
          lineHeight={1}
          font="/fonts/inter.woff"
        >
          {`Block #${index + 1}`}
        </Text>
      )}
    </mesh>
  )
}

function Connection({ start, end }: { start: [number, number, number]; end: [number, number, number] }) {
  const lineMaterialRef = useRef<THREE.LineBasicMaterial>(null)

  useFrame(({ clock }) => {
    if (lineMaterialRef.current) {
      // Pulse effect
      const pulse = Math.sin(clock.getElapsedTime() * 2) * 0.4 + 0.6
      lineMaterialRef.current.opacity = pulse
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
        opacity={0.6}
        transparent
      />
    </line>
  )
}

function DataParticles({ count = 100 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = new THREE.Object3D()
  const particles = useRef<{ position: THREE.Vector3; velocity: THREE.Vector3; target: number }[]>([])

  useEffect(() => {
    if (!particles.current.length) {
      for (let i = 0; i < count; i++) {
        const radius = 5 + Math.random() * 2
        const angle = Math.random() * Math.PI * 2
        const x = Math.cos(angle) * radius
        const y = (Math.random() - 0.5) * 4
        const z = Math.sin(angle) * radius

        // Target is a random other position
        const targetAngle = Math.random() * Math.PI * 2
        const targetRadius = 5 + Math.random() * 2
        const tx = Math.cos(targetAngle) * targetRadius
        const ty = (Math.random() - 0.5) * 4
        const tz = Math.sin(targetAngle) * targetRadius

        const position = new THREE.Vector3(x, y, z)
        const target = new THREE.Vector3(tx, ty, tz)
        const velocity = new THREE.Vector3()
          .subVectors(target, position)
          .normalize()
          .multiplyScalar(0.02 + Math.random() * 0.03)

        particles.current.push({
          position,
          velocity,
          target: Math.random() * 100, // Random lifetime
        })
      }
    }
  }, [count])

  useFrame(() => {
    if (mesh.current) {
      // Update particles
      for (let i = 0; i < particles.current.length; i++) {
        const particle = particles.current[i]

        // Move particle along its path
        particle.position.add(particle.velocity)
        particle.target -= particle.velocity.length()

        // If particle reached target or is out of bounds, reset it
        if (particle.target <= 0 || particle.position.length() > 10) {
          // New starting position
          const radius = 5 + Math.random() * 2
          const angle = Math.random() * Math.PI * 2
          const x = Math.cos(angle) * radius
          const y = (Math.random() - 0.5) * 4
          const z = Math.sin(angle) * radius

          // New target position
          const targetAngle = Math.random() * Math.PI * 2
          const targetRadius = 5 + Math.random() * 2
          const tx = Math.cos(targetAngle) * targetRadius
          const ty = (Math.random() - 0.5) * 4
          const tz = Math.sin(targetAngle) * targetRadius

          particle.position.set(x, y, z)
          const target = new THREE.Vector3(tx, ty, tz)
          particle.velocity = new THREE.Vector3()
            .subVectors(target, particle.position)
            .normalize()
            .multiplyScalar(0.02 + Math.random() * 0.03)
          particle.target = Math.random() * 100
        }

        // Update instance
        dummy.position.copy(particle.position)
        dummy.scale.set(0.1, 0.1, 0.1)
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
