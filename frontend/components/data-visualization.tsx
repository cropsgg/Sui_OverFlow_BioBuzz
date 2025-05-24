"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface DataVisualizationProps {
  data: number[]
  height: number
  color?: string
  glowColor?: string
  lineWidth?: number
  animated?: boolean
}

export function DataVisualization({
  data,
  height,
  color = "#3b82f6",
  glowColor = "rgba(59, 130, 246, 0.5)",
  lineWidth = 2,
  animated = true,
}: DataVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = svgRef.current
    const width = svg.clientWidth
    const dataPoints = data.length

    // Clear previous paths
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild)
    }

    // Create the path
    const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path")

    // Calculate path data
    let pathData = "M 0," + (height - data[0] * height) + " "

    for (let i = 1; i < dataPoints; i++) {
      const x = (i / (dataPoints - 1)) * width
      const y = height - data[i] * height
      pathData += "L " + x + "," + y + " "
    }

    pathElement.setAttribute("d", pathData)
    pathElement.setAttribute("fill", "none")
    pathElement.setAttribute("stroke", color)
    pathElement.setAttribute("stroke-width", lineWidth.toString())

    if (animated) {
      pathElement.setAttribute("class", "data-line")
    }

    // Add glow effect
    const filterElement = document.createElementNS("http://www.w3.org/2000/svg", "filter")
    filterElement.setAttribute("id", "glow")

    const feGaussianBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur")
    feGaussianBlur.setAttribute("stdDeviation", "2.5")
    feGaussianBlur.setAttribute("result", "coloredBlur")

    const feMerge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge")

    const feMergeNode1 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode")
    feMergeNode1.setAttribute("in", "coloredBlur")

    const feMergeNode2 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode")
    feMergeNode2.setAttribute("in", "SourceGraphic")

    feMerge.appendChild(feMergeNode1)
    feMerge.appendChild(feMergeNode2)

    filterElement.appendChild(feGaussianBlur)
    filterElement.appendChild(feMerge)

    svg.appendChild(filterElement)

    pathElement.setAttribute("filter", "url(#glow)")

    svg.appendChild(pathElement)

    // Add area under the curve with gradient
    const areaElement = document.createElementNS("http://www.w3.org/2000/svg", "path")

    const areaData = pathData + "L " + width + "," + height + " L 0," + height + " Z"
    areaElement.setAttribute("d", areaData)

    const gradientElement = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient")
    gradientElement.setAttribute("id", "areaGradient")
    gradientElement.setAttribute("x1", "0%")
    gradientElement.setAttribute("y1", "0%")
    gradientElement.setAttribute("x2", "0%")
    gradientElement.setAttribute("y2", "100%")

    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
    stop1.setAttribute("offset", "0%")
    stop1.setAttribute("stop-color", color)
    stop1.setAttribute("stop-opacity", "0.2")

    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
    stop2.setAttribute("offset", "100%")
    stop2.setAttribute("stop-color", color)
    stop2.setAttribute("stop-opacity", "0")

    gradientElement.appendChild(stop1)
    gradientElement.appendChild(stop2)

    const defsElement = document.createElementNS("http://www.w3.org/2000/svg", "defs")
    defsElement.appendChild(gradientElement)

    svg.insertBefore(defsElement, svg.firstChild)

    areaElement.setAttribute("fill", "url(#areaGradient)")

    svg.insertBefore(areaElement, pathElement)

    // Add data points
    for (let i = 0; i < dataPoints; i++) {
      const x = (i / (dataPoints - 1)) * width
      const y = height - data[i] * height

      const circleElement = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      circleElement.setAttribute("cx", x.toString())
      circleElement.setAttribute("cy", y.toString())
      circleElement.setAttribute("r", "3")
      circleElement.setAttribute("fill", color)

      svg.appendChild(circleElement)
    }
  }, [data, height, color, glowColor, lineWidth, animated])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="w-full">
      <svg ref={svgRef} width="100%" height={height} />
    </motion.div>
  )
}
