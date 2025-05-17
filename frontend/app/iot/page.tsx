"use client"

import type React from "react"

import { GlowingButton } from "@/components/glowing-button"
import { FuturisticCard } from "@/components/futuristic-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { AlertTriangle, ArrowDown, ArrowUp, Bell, Download, Thermometer } from "lucide-react"
import { useEffect, useState } from "react"

export default function IoTPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <motion.h1
            className="text-3xl font-bold tracking-tight gradient-text"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            IoT Monitoring
          </motion.h1>
          <motion.p
            className="text-muted-foreground"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Real-time sensor data with blockchain verification
          </motion.p>
        </div>
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlowingButton>
            <Bell className="mr-2 h-4 w-4" /> Configure Alerts
          </GlowingButton>
          <GlowingButton variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Data
          </GlowingButton>
        </motion.div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="glass-card">
          <TabsTrigger value="overview" className="data-[state=active]:gradient-text">
            Overview
          </TabsTrigger>
          <TabsTrigger value="temperature" className="data-[state=active]:gradient-text">
            Temperature
          </TabsTrigger>
          <TabsTrigger value="humidity" className="data-[state=active]:gradient-text">
            Humidity
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:gradient-text">
            Alerts
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SensorCard
              title="Lab Temperature"
              value="21.3°C"
              status="normal"
              change="-0.2"
              icon={<Thermometer className="h-5 w-5" />}
              delay={0}
            />
            <SensorCard
              title="Freezer #1"
              value="-80.1°C"
              status="normal"
              change="+0.1"
              icon={<Thermometer className="h-5 w-5" />}
              delay={0.1}
            />
            <SensorCard
              title="Freezer #2"
              value="-79.8°C"
              status="normal"
              change="-0.3"
              icon={<Thermometer className="h-5 w-5" />}
              delay={0.2}
            />
            <SensorCard
              title="Freezer #3"
              value="-76.2°C"
              status="warning"
              change="+2.8"
              icon={<Thermometer className="h-5 w-5" />}
              delay={0.3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FuturisticCard variant="glass" className="p-0">
              <div className="p-4 pb-2">
                <h3 className="text-lg font-semibold gradient-text">Temperature Trends</h3>
                <p className="text-sm text-muted-foreground">
                  24-hour temperature readings with blockchain verification
                </p>
              </div>
              <div className="p-4 pt-0">
                <div className="h-[300px] relative">
                  <TemperatureChart />
                </div>
              </div>
            </FuturisticCard>
            <FuturisticCard variant="glass" className="p-0">
              <div className="p-4 pb-2">
                <h3 className="text-lg font-semibold gradient-text">Recent Alerts</h3>
                <p className="text-sm text-muted-foreground">Sensor alerts with timestamp verification</p>
              </div>
              <div className="p-4 pt-0">
                <div className="space-y-4">
                  <AlertItem
                    title="Freezer #3 Temperature Rising"
                    description="Temperature increased by 2.8°C in the last hour"
                    time="2 hours ago"
                    severity="warning"
                    verified={true}
                    delay={0}
                  />
                  <AlertItem
                    title="Lab Humidity Fluctuation"
                    description="Humidity dropped from 45% to 32% in 30 minutes"
                    time="Yesterday"
                    severity="info"
                    verified={true}
                    delay={0.1}
                  />
                  <AlertItem
                    title="Power Fluctuation Detected"
                    description="Brief power fluctuation detected in Circuit B"
                    time="2 days ago"
                    severity="warning"
                    verified={true}
                    delay={0.2}
                  />
                </div>
              </div>
            </FuturisticCard>
          </div>
        </TabsContent>
        <TabsContent value="temperature" className="space-y-4">
          <FuturisticCard variant="glass" className="p-0">
            <div className="p-4 pb-2">
              <h3 className="text-lg font-semibold gradient-text">Temperature Sensors</h3>
              <p className="text-sm text-muted-foreground">Detailed temperature readings from all lab sensors</p>
            </div>
            <div className="p-4 pt-0">
              <div className="h-[400px] relative">
                <DetailedTemperatureChart />
              </div>
            </div>
          </FuturisticCard>
        </TabsContent>
        <TabsContent value="humidity" className="space-y-4">
          <FuturisticCard variant="glass" className="p-0">
            <div className="p-4 pb-2">
              <h3 className="text-lg font-semibold gradient-text">Humidity Sensors</h3>
              <p className="text-sm text-muted-foreground">Detailed humidity readings from all lab sensors</p>
            </div>
            <div className="p-4 pt-0">
              <div className="h-[400px] relative">
                <HumidityChart />
              </div>
            </div>
          </FuturisticCard>
        </TabsContent>
        <TabsContent value="alerts" className="space-y-4">
          <FuturisticCard variant="glass" className="p-0">
            <div className="p-4 pb-2">
              <h3 className="text-lg font-semibold gradient-text">Alert History</h3>
              <p className="text-sm text-muted-foreground">
                Complete history of sensor alerts with blockchain verification
              </p>
            </div>
            <div className="p-4 pt-0">
              <div className="space-y-4">
                <AlertItem
                  title="Freezer #3 Temperature Rising"
                  description="Temperature increased by 2.8°C in the last hour"
                  time="2 hours ago"
                  severity="warning"
                  verified={true}
                  delay={0}
                />
                <AlertItem
                  title="Lab Humidity Fluctuation"
                  description="Humidity dropped from 45% to 32% in 30 minutes"
                  time="Yesterday"
                  severity="info"
                  verified={true}
                  delay={0.1}
                />
                <AlertItem
                  title="Power Fluctuation Detected"
                  description="Brief power fluctuation detected in Circuit B"
                  time="2 days ago"
                  severity="warning"
                  verified={true}
                  delay={0.2}
                />
                <AlertItem
                  title="Freezer #2 Door Open"
                  description="Freezer #2 door left open for more than 2 minutes"
                  time="3 days ago"
                  severity="critical"
                  verified={true}
                  delay={0.3}
                />
                <AlertItem
                  title="Network Connectivity Issue"
                  description="Brief connectivity loss to IoT gateway"
                  time="5 days ago"
                  severity="info"
                  verified={true}
                  delay={0.4}
                />
              </div>
            </div>
          </FuturisticCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SensorCard({
  title,
  value,
  status,
  change,
  icon,
  delay,
}: {
  title: string
  value: string
  status: "normal" | "warning" | "critical"
  change: string
  icon: React.ReactNode
  delay: number
}) {
  const isPositive = change.startsWith("+")

  return (
    <FuturisticCard
      variant="glass"
      delay={delay}
      className={`p-0 ${status === "warning" ? "border-yellow-500/50" : status === "critical" ? "border-red-500/50" : "border-blue-500/30"}`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            <span className="text-2xl font-bold gradient-text">{value}</span>
            <div className="flex items-center">
              {isPositive ? (
                <ArrowUp className="h-4 w-4 text-red-500 mr-1" />
              ) : (
                <ArrowDown className="h-4 w-4 text-green-500 mr-1" />
              )}
              <span className={`text-xs ${isPositive ? "text-red-500" : "text-green-500"}`}>{change}°C</span>
            </div>
          </div>
          <div
            className={`p-2 rounded-full ${
              status === "normal" ? "bg-green-500/10" : status === "warning" ? "bg-yellow-500/10" : "bg-red-500/10"
            }`}
          >
            {icon}
          </div>
        </div>
      </div>
    </FuturisticCard>
  )
}

function AlertItem({
  title,
  description,
  time,
  severity,
  verified,
  delay,
}: {
  title: string
  description: string
  time: string
  severity: "info" | "warning" | "critical"
  verified: boolean
  delay: number
}) {
  return (
    <motion.div
      className="flex items-start space-x-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ x: 5 }}
    >
      <div
        className={`p-2 rounded-full ${
          severity === "info" ? "bg-blue-500/10" : severity === "warning" ? "bg-yellow-500/10" : "bg-red-500/10"
        }`}
      >
        <AlertTriangle
          className={`h-5 w-5 ${
            severity === "info" ? "text-blue-500" : severity === "warning" ? "text-yellow-500" : "text-red-500"
          }`}
        />
      </div>
      <div className="space-y-1">
        <h4 className="font-medium gradient-text">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">{time}</p>
          {verified && (
            <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">Verified</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function TemperatureChart() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 300" className="absolute inset-0">
      {/* Grid Lines */}
      <g>
        <line x1="50" y1="250" x2="750" y2="250" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
        <line x1="50" y1="200" x2="750" y2="200" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
        <line x1="50" y1="150" x2="750" y2="150" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
        <line x1="50" y1="100" x2="750" y2="100" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
        <line x1="50" y1="50" x2="750" y2="50" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
      </g>

      {/* Y-axis labels */}
      <g fill="rgba(255,255,255,0.6)" fontSize="12">
        <text x="30" y="250" textAnchor="end">
          -85°C
        </text>
        <text x="30" y="200" textAnchor="end">
          -82°C
        </text>
        <text x="30" y="150" textAnchor="end">
          -79°C
        </text>
        <text x="30" y="100" textAnchor="end">
          -76°C
        </text>
        <text x="30" y="50" textAnchor="end">
          -73°C
        </text>
      </g>

      {/* X-axis labels */}
      <g fill="rgba(255,255,255,0.6)" fontSize="12">
        <text x="50" y="270" textAnchor="middle">
          00:00
        </text>
        <text x="190" y="270" textAnchor="middle">
          06:00
        </text>
        <text x="330" y="270" textAnchor="middle">
          12:00
        </text>
        <text x="470" y="270" textAnchor="middle">
          18:00
        </text>
        <text x="610" y="270" textAnchor="middle">
          00:00
        </text>
        <text x="750" y="270" textAnchor="middle">
          Now
        </text>
      </g>

      {/* Glow Filter */}
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Temperature Lines */}
      <g>
        {/* Freezer 1 */}
        <path
          d="M50,150 L120,152 L190,149 L260,151 L330,148 L400,150 L470,147 L540,149 L610,151 L680,150 L750,151"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          className="data-line"
          filter="url(#glow)"
        />

        {/* Freezer 2 */}
        <path
          d="M50,155 L120,153 L190,156 L260,154 L330,157 L400,155 L470,158 L540,156 L610,154 L680,157 L750,155"
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="2"
          className="data-line"
          filter="url(#glow)"
          style={{ animationDelay: "0.5s" }}
        />

        {/* Freezer 3 */}
        <path
          d="M50,160 L120,158 L190,162 L260,165 L330,170 L400,175 L470,180 L540,185 L610,190 L680,100 L750,110"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          className="data-line"
          filter="url(#glow)"
          style={{ animationDelay: "1s" }}
        />
      </g>

      {/* Legend */}
      <g transform="translate(600, 30)">
        <rect x="0" y="0" width="140" height="80" rx="4" fill="rgba(0,0,0,0.3)" className="glass-card" />

        <circle cx="15" cy="20" r="5" fill="#3b82f6" />
        <text x="30" y="25" fill="white" fontSize="12">
          Freezer #1
        </text>

        <circle cx="15" cy="45" r="5" fill="#8b5cf6" />
        <text x="30" y="50" fill="white" fontSize="12">
          Freezer #2
        </text>

        <circle cx="15" cy="70" r="5" fill="#ef4444" />
        <text x="30" y="75" fill="white" fontSize="12">
          Freezer #3
        </text>
      </g>

      {/* Alert Zone */}
      <rect x="610" y="50" width="140" height="200" fill="rgba(239, 68, 68, 0.1)" />
      <text x="680" y="40" fill="#ef4444" fontSize="12" textAnchor="middle" className="glow-text">
        Alert Zone
      </text>
    </svg>
  )
}

function DetailedTemperatureChart() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 400" className="absolute inset-0">
      {/* Grid Lines */}
      <g>
        <line x1="50" y1="350" x2="750" y2="350" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
        <line x1="50" y1="300" x2="750" y2="300" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
        <line x1="50" y1="250" x2="750" y2="250" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
        <line x1="50" y1="200" x2="750" y2="200" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
        <line x1="50" y1="150" x2="750" y2="150" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
        <line x1="50" y1="100" x2="750" y2="100" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
        <line x1="50" y1="50" x2="750" y2="50" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
      </g>

      {/* Y-axis labels */}
      <g fill="rgba(255,255,255,0.6)" fontSize="12">
        <text x="30" y="350" textAnchor="end">
          -85°C
        </text>
        <text x="30" y="300" textAnchor="end">
          -82°C
        </text>
        <text x="30" y="250" textAnchor="end">
          -79°C
        </text>
        <text x="30" y="200" textAnchor="end">
          -76°C
        </text>
        <text x="30" y="150" textAnchor="end">
          -73°C
        </text>
        <text x="30" y="100" textAnchor="end">
          20°C
        </text>
        <text x="30" y="50" textAnchor="end">
          25°C
        </text>
      </g>

      {/* X-axis labels */}
      <g fill="rgba(255,255,255,0.6)" fontSize="12">
        <text x="50" y="370" textAnchor="middle">
          00:00
        </text>
        <text x="190" y="370" textAnchor="middle">
          06:00
        </text>
        <text x="330" y="370" textAnchor="middle">
          12:00
        </text>
        <text x="470" y="370" textAnchor="middle">
          18:00
        </text>
        <text x="610" y="370" textAnchor="middle">
          00:00
        </text>
        <text x="750" y="370" textAnchor="middle">
          Now
        </text>
      </g>

      {/* Glow Filter */}
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Temperature Lines */}
      <g>
        {/* Lab Temperature */}
        <path
          d="M50,80 L120,85 L190,90 L260,88 L330,85 L400,82 L470,80 L540,78 L610,75 L680,78 L750,80"
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          className="data-line"
          filter="url(#glow)"
        />

        {/* Freezer 1 */}
        <path
          d="M50,250 L120,252 L190,249 L260,251 L330,248 L400,250 L470,247 L540,249 L610,251 L680,250 L750,251"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          className="data-line"
          filter="url(#glow)"
          style={{ animationDelay: "0.5s" }}
        />

        {/* Freezer 2 */}
        <path
          d="M50,255 L120,253 L190,256 L260,254 L330,257 L400,255 L470,258 L540,256 L610,254 L680,257 L750,255"
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="2"
          className="data-line"
          filter="url(#glow)"
          style={{ animationDelay: "1s" }}
        />

        {/* Freezer 3 */}
        <path
          d="M50,260 L120,258 L190,262 L260,265 L330,270 L400,275 L470,280 L540,285 L610,190 L680,200 L750,210"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          className="data-line"
          filter="url(#glow)"
          style={{ animationDelay: "1.5s" }}
        />
      </g>

      {/* Legend */}
      <g transform="translate(600, 30)">
        <rect x="0" y="0" width="140" height="105" rx="4" fill="rgba(0,0,0,0.3)" className="glass-card" />

        <circle cx="15" cy="20" r="5" fill="#10b981" />
        <text x="30" y="25" fill="white" fontSize="12">
          Lab Temperature
        </text>

        <circle cx="15" cy="45" r="5" fill="#3b82f6" />
        <text x="30" y="50" fill="white" fontSize="12">
          Freezer #1
        </text>

        <circle cx="15" cy="70" r="5" fill="#8b5cf6" />
        <text x="30" y="75" fill="white" fontSize="12">
          Freezer #2
        </text>

        <circle cx="15" cy="95" r="5" fill="#ef4444" />
        <text x="30" y="100" fill="white" fontSize="12">
          Freezer #3
        </text>
      </g>

      {/* Alert Zone */}
      <rect x="610" y="150" width="140" height="200" fill="rgba(239, 68, 68, 0.1)" />
      <text x="680" y="140" fill="#ef4444" fontSize="12" textAnchor="middle" className="glow-text">
        Alert Zone
      </text>
    </svg>
  )
}

function HumidityChart() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 400" className="absolute inset-0">
      {/* Grid Lines */}
      <g>
        <line x1="50" y1="350" x2="750" y2="350" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
        <line x1="50" y1="300" x2="750" y2="300" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
        <line x1="50" y1="250" x2="750" y2="250" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
        <line x1="50" y1="200" x2="750" y2="200" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
        <line x1="50" y1="150" x2="750" y2="150" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
        <line x1="50" y1="100" x2="750" y2="100" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
        <line x1="50" y1="50" x2="750" y2="50" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
      </g>

      {/* Y-axis labels */}
      <g fill="rgba(255,255,255,0.6)" fontSize="12">
        <text x="30" y="350" textAnchor="end">
          20%
        </text>
        <text x="30" y="300" textAnchor="end">
          30%
        </text>
        <text x="30" y="250" textAnchor="end">
          40%
        </text>
        <text x="30" y="200" textAnchor="end">
          50%
        </text>
        <text x="30" y="150" textAnchor="end">
          60%
        </text>
        <text x="30" y="100" textAnchor="end">
          70%
        </text>
        <text x="30" y="50" textAnchor="end">
          80%
        </text>
      </g>

      {/* X-axis labels */}
      <g fill="rgba(255,255,255,0.6)" fontSize="12">
        <text x="50" y="370" textAnchor="middle">
          00:00
        </text>
        <text x="190" y="370" textAnchor="middle">
          06:00
        </text>
        <text x="330" y="370" textAnchor="middle">
          12:00
        </text>
        <text x="470" y="370" textAnchor="middle">
          18:00
        </text>
        <text x="610" y="370" textAnchor="middle">
          00:00
        </text>
        <text x="750" y="370" textAnchor="middle">
          Now
        </text>
      </g>

      {/* Glow Filter */}
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Humidity Lines */}
      <g>
        {/* Lab Humidity */}
        <path
          d="M50,200 L120,190 L190,210 L260,220 L330,200 L400,180 L470,250 L540,300 L610,280 L680,250 L750,230"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="2"
          className="data-line"
          filter="url(#glow)"
        />

        {/* Clean Room Humidity */}
        <path
          d="M50,150 L120,155 L190,152 L260,148 L330,150 L400,153 L470,155 L540,150 L610,148 L680,152 L750,150"
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="2"
          className="data-line"
          filter="url(#glow)"
          style={{ animationDelay: "0.5s" }}
        />
      </g>

      {/* Legend */}
      <g transform="translate(600, 30)">
        <rect x="0" y="0" width="140" height="55" rx="4" fill="rgba(0,0,0,0.3)" className="glass-card" />

        <circle cx="15" cy="20" r="5" fill="#06b6d4" />
        <text x="30" y="25" fill="white" fontSize="12">
          Lab Humidity
        </text>

        <circle cx="15" cy="45" r="5" fill="#8b5cf6" />
        <text x="30" y="50" fill="white" fontSize="12">
          Clean Room
        </text>
      </g>

      {/* Alert Zone */}
      <rect x="400" y="250" width="140" height="100" fill="rgba(239, 68, 68, 0.1)" />
      <text x="470" y="240" fill="#ef4444" fontSize="12" textAnchor="middle" className="glow-text">
        Alert Zone
      </text>
    </svg>
  )
}
