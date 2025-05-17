"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Text, OrbitControls, Float, MeshTransmissionMaterial } from "@react-three/drei"
import { motion } from "framer-motion"
import * as THREE from "three"

export function DAOGovernanceModel({
  className = "",
  voteData = [70, 20, 10],
}: { className?: string; voteData?: number[] }) {
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
        <GovernanceModel voteData={voteData} />
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
          <span className="font-semibold">Active Proposals:</span> 3
        </p>
        <p className="text-xs text-blue-300">
          <span className="font-semibold">Voting Power:</span> 8,750 tokens
        </p>
        <p className="text-xs text-blue-300">
          <span className="font-semibold">Participation:</span> 87%
        </p>
      </div>
    </motion.div>
  )
}

function GovernanceModel({ voteData }: { voteData: number[] }) {
  const group = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.y = clock.getElapsedTime() * 0.1
    }
  })

  // Calculate percentages and rotation angles
  const total = voteData.reduce((acc, curr) => acc + curr, 0)
  const percents = voteData.map((val) => (val / total) * 100)

  // Convert percentages to radians for the pie chart
  const angles: [number, number, string, string][] = []
  let startAngle = 0

  percents.forEach((percent, i) => {
    const endAngle = startAngle + (percent / 100) * Math.PI * 2
    const color = i === 0 ? "#22c55e" : i === 1 ? "#ef4444" : "#94a3b8"
    const label = i === 0 ? "Yes" : i === 1 ? "No" : "Abstain"
    angles.push([startAngle, endAngle, color, label])
    startAngle = endAngle
  })

  return (
    <group ref={group}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <group position={[0, 0, 0]}>
          {angles.map((angle, i) => (
            <VoteSegment key={i} startAngle={angle[0]} endAngle={angle[1]} color={angle[2]} label={angle[3]} />
          ))}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[2, 32, 32]} />
            <MeshTransmissionMaterial
              samples={16}
              resolution={256}
              thickness={0.5}
              chromaticAberration={0.5}
              anisotropy={0.5}
              distortion={0.5}
              distortionScale={0.5}
              temporalDistortion={0}
              iridescence={1}
              iridescenceIOR={1}
              iridescenceThicknessRange={[0, 1400]}
              clearcoat={1}
              attenuationDistance={0.5}
              attenuationColor="#ffffff"
              color="#ffffff"
              backside
              opacity={0.15}
              transparent
            />
          </mesh>
        </group>
      </Float>

      <Text
        position={[0, 3.5, 0]}
        fontSize={0.5}
        color="#3b82f6"
        anchorX="center"
        anchorY="middle"
        maxWidth={4}
        lineHeight={1}
        font="/fonts/inter.woff"
      >
        Governance Votes
      </Text>

      <group position={[0, -3.5, 0]}>
        {angles.map((angle, i) => (
          <Text
            key={i}
            position={[i * 2 - 2, 0, 0]}
            fontSize={0.4}
            color={angle[2]}
            anchorX="center"
            anchorY="middle"
            maxWidth={2}
            lineHeight={1}
            font="/fonts/inter.woff"
          >
            {`${angle[3]}: ${percents[i].toFixed(1)}%`}
          </Text>
        ))}
      </group>

      <Nodes count={30} />
    </group>
  )
}

function VoteSegment({
  startAngle,
  endAngle,
  color,
  label,
}: {
  startAngle: number
  endAngle: number
  color: string
  label: string
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const angleSpan = endAngle - startAngle
  const segments = Math.max(Math.ceil((angleSpan * 32) / (Math.PI * 2)), 3)

  // Generate pie segment
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)

  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + (i / segments) * angleSpan
    const x = Math.cos(angle) * 2
    const y = Math.sin(angle) * 2
    shape.lineTo(x, y)
  }

  shape.lineTo(0, 0)

  const extrudeSettings = {
    steps: 1,
    depth: 0.5,
    bevelEnabled: false,
  }

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Pulse the segment slightly
      const pulse = Math.sin(clock.getElapsedTime() * 1.5) * 0.02 + 1
      meshRef.current.scale.set(1, 1, pulse)
    }
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} castShadow receiveShadow>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        roughness={0.3}
        metalness={0.8}
        transparent
        opacity={0.9}
      />
    </mesh>
  )
}

function Nodes({ count = 30 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = new THREE.Object3D()

  useFrame(({ clock }) => {
    if (mesh.current) {
      for (let i = 0; i < count; i++) {
        const time = clock.getElapsedTime()

        // Calculate orbital position
        const angle = (i / count) * Math.PI * 2 + time * 0.1
        const radius = 4.5
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius

        // Oscillate the y position
        const y = Math.sin(angle * 3 + time) * 0.5

        dummy.position.set(x, y, z)
        dummy.rotation.set(time * 0.5, time * 0.3, 0)
        dummy.scale.set(
          0.12 + Math.sin(time + i) * 0.02,
          0.12 + Math.sin(time + i) * 0.02,
          0.12 + Math.sin(time + i) * 0.02,
        )
        dummy.updateMatrix()
        mesh.current.setMatrixAt(i, dummy.matrix)
      }
      mesh.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#3b82f6"
        emissive="#3b82f6"
        emissiveIntensity={0.5}
        roughness={0.3}
        metalness={0.8}
      />
    </instancedMesh>
  )
}
