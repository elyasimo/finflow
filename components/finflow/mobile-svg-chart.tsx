"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"

interface DataPoint {
  label: string
  value: number
  secondaryValue?: number
  color?: string
}

interface MobileSVGChartProps {
  data: DataPoint[]
  type: 'bar' | 'line' | 'donut'
  height?: number
  primaryColor?: string
  secondaryColor?: string
  showLabels?: boolean
  showTooltip?: boolean
  formatValue?: (value: number) => string
  className?: string
}

export default function MobileSVGChart({
  data,
  type,
  height = 200,
  primaryColor = '#3b82f6',
  secondaryColor = '#10b981',
  showLabels = true,
  showTooltip = true,
  formatValue = (v) => v.toLocaleString('de-CH'),
  className = ''
}: MobileSVGChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  const maxValue = useMemo(() => {
    if (data.length === 0) return 100
    const values = data.flatMap(d => [d.value, d.secondaryValue || 0])
    return Math.max(...values) * 1.1 // Add 10% padding
  }, [data])

  const handleTouch = (index: number, e: React.TouchEvent | React.MouseEvent) => {
    setActiveIndex(index)
    const rect = (e.target as SVGElement).getBoundingClientRect()
    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top })
  }

  const handleTouchEnd = () => {
    // Keep tooltip visible for a moment
    setTimeout(() => setActiveIndex(null), 2000)
  }

  // Bar Chart
  if (type === 'bar') {
    const barWidth = Math.max(20, Math.min(50, (300 - data.length * 8) / data.length))
    const chartWidth = data.length * (barWidth + 8) + 40
    const chartHeight = height
    const barAreaHeight = chartHeight - 40

    return (
      <div className={cn("relative", className)}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full"
          style={{ maxHeight: height }}
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent) => (
            <line
              key={percent}
              x1="30"
              y1={barAreaHeight * (1 - percent / 100)}
              x2={chartWidth - 10}
              y2={barAreaHeight * (1 - percent / 100)}
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeDasharray="2,2"
            />
          ))}

          {/* Bars */}
          {data.map((item, index) => {
            const x = 40 + index * (barWidth + 8)
            const primaryHeight = (item.value / maxValue) * barAreaHeight
            const secondaryHeight = item.secondaryValue 
              ? (item.secondaryValue / maxValue) * barAreaHeight 
              : 0
            const isActive = activeIndex === index

            return (
              <g key={index}>
                {/* Secondary bar (if exists) */}
                {item.secondaryValue !== undefined && (
                  <rect
                    x={x + barWidth / 4}
                    y={barAreaHeight - secondaryHeight}
                    width={barWidth / 2}
                    height={secondaryHeight}
                    rx="4"
                    fill={item.color || secondaryColor}
                    opacity={isActive ? 1 : 0.6}
                    className="transition-opacity"
                  />
                )}
                
                {/* Primary bar */}
                <rect
                  x={item.secondaryValue !== undefined ? x : x}
                  y={barAreaHeight - primaryHeight}
                  width={item.secondaryValue !== undefined ? barWidth / 2 : barWidth}
                  height={primaryHeight}
                  rx="4"
                  fill={primaryColor}
                  opacity={isActive ? 1 : 0.8}
                  className="transition-all cursor-pointer"
                  onTouchStart={(e) => handleTouch(index, e)}
                  onTouchEnd={handleTouchEnd}
                  onClick={(e) => handleTouch(index, e)}
                />

                {/* Label */}
                {showLabels && (
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    className="text-[10px] fill-gray-500 dark:fill-gray-400"
                  >
                    {item.label}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* Tooltip */}
        {showTooltip && activeIndex !== null && (
          <div 
            className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium shadow-xl z-10 whitespace-nowrap"
            style={{ left: `${(activeIndex + 0.5) / data.length * 100}%` }}
          >
            <div className="font-semibold">{data[activeIndex].label}</div>
            <div className="text-xs opacity-80">{formatValue(data[activeIndex].value)}</div>
            {data[activeIndex].secondaryValue !== undefined && (
              <div className="text-xs opacity-60">{formatValue(data[activeIndex].secondaryValue)}</div>
            )}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-white" />
          </div>
        )}
      </div>
    )
  }

  // Line Chart
  if (type === 'line') {
    const chartWidth = 300
    const chartHeight = height
    const padding = { top: 20, right: 20, bottom: 30, left: 40 }
    const plotWidth = chartWidth - padding.left - padding.right
    const plotHeight = chartHeight - padding.top - padding.bottom

    const points = data.map((item, index) => ({
      x: padding.left + (index / (data.length - 1 || 1)) * plotWidth,
      y: padding.top + plotHeight - (item.value / maxValue) * plotHeight,
      ...item
    }))

    const pathD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ')

    const areaD = `${pathD} L ${points[points.length - 1]?.x || padding.left} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`

    return (
      <div className={cn("relative", className)}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full"
          style={{ maxHeight: height }}
        >
          {/* Grid */}
          {[0, 25, 50, 75, 100].map((percent) => (
            <g key={percent}>
              <line
                x1={padding.left}
                y1={padding.top + plotHeight * (1 - percent / 100)}
                x2={chartWidth - padding.right}
                y2={padding.top + plotHeight * (1 - percent / 100)}
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeDasharray="2,2"
              />
            </g>
          ))}

          {/* Area fill */}
          <path
            d={areaD}
            fill={primaryColor}
            fillOpacity="0.1"
          />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={primaryColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r={activeIndex === index ? 8 : 5}
                fill={activeIndex === index ? primaryColor : 'white'}
                stroke={primaryColor}
                strokeWidth="2"
                className="cursor-pointer transition-all"
                onTouchStart={(e) => handleTouch(index, e)}
                onTouchEnd={handleTouchEnd}
                onClick={(e) => handleTouch(index, e)}
              />

              {/* Labels */}
              {showLabels && index % Math.ceil(data.length / 6) === 0 && (
                <text
                  x={point.x}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  className="text-[9px] fill-gray-500 dark:fill-gray-400"
                >
                  {point.label}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {showTooltip && activeIndex !== null && points[activeIndex] && (
          <div 
            className="absolute px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium shadow-xl z-10 whitespace-nowrap"
            style={{ 
              left: `${(points[activeIndex].x / chartWidth) * 100}%`,
              top: `${(points[activeIndex].y / chartHeight) * 100 - 15}%`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="font-semibold">{data[activeIndex].label}</div>
            <div className="text-xs opacity-80">{formatValue(data[activeIndex].value)}</div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-white" />
          </div>
        )}
      </div>
    )
  }

  // Donut Chart
  if (type === 'donut') {
    const total = data.reduce((sum, d) => sum + d.value, 0)
    const centerX = 150
    const centerY = 100
    const outerRadius = 80
    const innerRadius = 50

    // Generate arc paths
    let currentAngle = -Math.PI / 2 // Start from top

    const arcs = data.map((item, index) => {
      const angle = (item.value / total) * Math.PI * 2
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      currentAngle = endAngle

      const x1 = centerX + outerRadius * Math.cos(startAngle)
      const y1 = centerY + outerRadius * Math.sin(startAngle)
      const x2 = centerX + outerRadius * Math.cos(endAngle)
      const y2 = centerY + outerRadius * Math.sin(endAngle)
      
      const ix1 = centerX + innerRadius * Math.cos(startAngle)
      const iy1 = centerY + innerRadius * Math.sin(startAngle)
      const ix2 = centerX + innerRadius * Math.cos(endAngle)
      const iy2 = centerY + innerRadius * Math.sin(endAngle)

      const largeArc = angle > Math.PI ? 1 : 0

      return {
        path: `M ${ix1} ${iy1} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
        color: item.color || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][index % 6],
        percentage: ((item.value / total) * 100).toFixed(1),
        ...item
      }
    })

    return (
      <div className={cn("relative", className)}>
        <svg
          viewBox="0 0 300 200"
          className="w-full"
          style={{ maxHeight: height }}
        >
          {arcs.map((arc, index) => (
            <path
              key={index}
              d={arc.path}
              fill={arc.color}
              opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
              className="cursor-pointer transition-opacity"
              onTouchStart={(e) => handleTouch(index, e)}
              onTouchEnd={handleTouchEnd}
              onClick={(e) => handleTouch(index, e)}
            />
          ))}

          {/* Center text */}
          <text
            x={centerX}
            y={centerY - 8}
            textAnchor="middle"
            className="text-2xl font-bold fill-gray-900 dark:fill-white"
          >
            {activeIndex !== null ? `${arcs[activeIndex].percentage}%` : total.toLocaleString('de-CH')}
          </text>
          <text
            x={centerX}
            y={centerY + 12}
            textAnchor="middle"
            className="text-xs fill-gray-500 dark:fill-gray-400"
          >
            {activeIndex !== null ? arcs[activeIndex].label : 'Gesamt'}
          </text>
        </svg>

        {/* Legend */}
        {showLabels && (
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {arcs.map((arc, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1 rounded-lg transition-all",
                  activeIndex === index && "bg-gray-100 dark:bg-gray-800"
                )}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: arc.color }}
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {arc.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return null
}
