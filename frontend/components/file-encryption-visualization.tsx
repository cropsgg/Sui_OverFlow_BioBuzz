"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Text, OrbitControls, MeshTransmissionMaterial } from "@react-three/drei"
import { motion } from "framer-motion"
import type * as THREE from "three"

export function FileEncryptionVisualization({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false)
  const [encryptionProgress, setEncryptionProgress] = useState(0)

  useEffect(() => {
    setMounted(true)

    // Simulate encryption progress
    const interval = setInterval(() => {
      setEncryptionProgress((prev) => {
        if (prev >= 100) {
          return 0 // Reset when complete
        }
        return prev + 1
      })
    }, 100)

    return () => clearInterval(interval)
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
        <EncryptionModel progress={encryptionProgress} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
      <div className="absolute bottom-4 left-4 rounded-md bg-black/50 p-2 backdrop-blur-md">
        <p className="text-xs text-blue-300">
          <span className="font-semibold">Encryption:</span> {encryptionProgress}%
        </p>
        <p className="text-xs text-blue-300">
          <span className="font-semibold">Algorithm:</span> AES-256
        </p>
        <p className="text-xs text-blue-300">
          <span className="font-semibold">End-to-End:</span> Enabled
        </p>
      </div>
    </motion.div>
  )
}

function EncryptionModel({ progress }: { progress: number }) {
  const fileRef = useRef<THREE.Group>(null)
  const keyRef = useRef<THREE.Mesh>(null)
  const encryptedFileRef = useRef<THREE.Mesh>(null)

  const progressNormalized = progress / 100

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    if (fileRef.current) {
      // Original file floats and spins gently
      fileRef.current.position.y = Math.sin(t * 0.5) * 0.2
      fileRef.current.rotation.y = t * 0.1
    }

    if (keyRef.current) {
      // Key orbits around
      const keyOrbitRadius = 3
      keyRef.current.position.x = Math.cos(t * 0.7) * keyOrbitRadius
      keyRef.current.position.z = Math.sin(t * 0.7) * keyOrbitRadius
      keyRef.current.rotation.y = t * 0.5
    }

    if (encryptedFileRef.current) {
      // Encrypted file pulses
      const scale = 1.5 + Math.sin(t * 2) * 0.05
      encryptedFileRef.current.scale.set(scale, scale, scale)
      encryptedFileRef.current.rotation.y = t * 0.2
    }
  })

  return (
    <group>
      {/* Original File */}
      <group ref={fileRef} position={[-3, 0, 0]} visible={progressNormalized < 0.5}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.5, 2, 0.2]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.5} />
        </mesh>

        {/* File contents (lines) */}
        {[0.4, 0, -0.4].map((y, i) => (
          <mesh key={i} position={[0, y, 0.15]} castShadow>
            <planeGeometry args={[1, 0.1]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </mesh>
        ))}

        <Text
          position={[0, 1.2, 0.2]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.5}
          lineHeight={1}
          font="/fonts/inter.woff"
        >
          Original File
        </Text>
      </group>

      {/* Encryption Key */}
      <mesh ref={keyRef} position={[0, 0, 3]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.2, 1.2, 8]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#f59e0b"
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.8}
        />

        {/* Key teeth */}
        <group position={[0, -0.3, 0.1]}>
          {[0, 0.2, 0.4].map((y, i) => (
            <mesh key={i} position={[0, y, 0]} castShadow>
              <boxGeometry args={[0.4, 0.1, 0.05]} />
              <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.8} />
            </mesh>
          ))}
        </group>

        <Text
          position={[0, 0.8, 0]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          maxWidth={1}
          lineHeight={1}
          font="/fonts/inter.woff"
        >
          Encryption Key
        </Text>
      </mesh>

      {/* Encryption Process Animation */}
      <group position={[0, 0, 0]} visible={progressNormalized >= 0.3 && progressNormalized <= 0.7}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[1, 16, 16]} />
          <MeshTransmissionMaterial
            color="#3b82f6"
            thickness={0.5}
            roughness={0}
            clearcoat={1}
            clearcoatRoughness={0}
            transmission={1}
            chromaticAberration={1}
            anisotropicBlur={0.5}
            distortion={0.1}
            distortionScale={0.2}
            temporalDistortion={0.1}
            attenuationDistance={0.5}
            attenuationColor="#ffffff"
          />
        </mesh>

        {/* Binary data particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <Text
            key={i}
            position={[
              Math.sin(i * 1.1) * (0.5 + Math.random() * 0.5),
              Math.cos(i * 0.9) * (0.5 + Math.random() * 0.5),
              Math.sin(i * 0.7) * (0.5 + Math.random() * 0.5),
            ]}
            fontSize={0.12 + Math.random() * 0.08}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            font="/fonts/inter.woff"
          >
            {Math.random() > 0.5 ? "1" : "0"}
          </Text>
        ))}

        <Text
          position={[0, 1.5, 0]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          maxWidth={2}
          lineHeight={1}
          font="/fonts/inter.woff"
        >
          Encrypting...
        </Text>
      </group>

      {/* Encrypted File */}
      <mesh ref={encryptedFileRef} position={[3, 0, 0]} castShadow receiveShadow visible={progressNormalized > 0.6}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#10b981"
          emissive="#10b981"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.9}
          wireframe={true}
        />

        <mesh position={[0, 0, 0]}>
          <icosahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial color="#10b981" transparent opacity={0.5} />
        </mesh>

        <Text
          position={[0, 1.5, 0]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          maxWidth={2}
          lineHeight={1}
          font="/fonts/inter.woff"
        >
          Encrypted File
        </Text>
      </mesh>

      {/* Progress Indicator */}
      <group position={[0, -2.5, 0]}>
        <mesh position={[0, 0, -0.1]} receiveShadow>
          <boxGeometry args={[6, 0.3, 0.1]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>

        <mesh position={[-3 + progressNormalized * 3, 0, 0]} receiveShadow>
          <boxGeometry args={[progressNormalized * 6, 0.3, 0.15]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
        </mesh>

        <Text
          position={[0, 0.5, 0]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          maxWidth={5}
          lineHeight={1}
          font="/fonts/inter.woff"
        >
          {`Encryption Progress: ${progress}%`}
        </Text>
      </group>
    </group>
  )
}
