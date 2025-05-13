'use client'

import { useMemo } from 'react'
import styles from './RadarChart.module.css'

const categoryEnum = {
  MIGRATION_SAFETY: 'MIGRATION_SAFETY',
  DATA_INTEGRITY: 'DATA_INTEGRITY',
  PERFORMANCE_IMPACT: 'PERFORMANCE_IMPACT',
  PROJECT_RULES_CONSISTENCY: 'PROJECT_RULES_CONSISTENCY',
  SECURITY_OR_SCALABILITY: 'SECURITY_OR_SCALABILITY',
} as const

export type CategoryEnum = (typeof categoryEnum)[keyof typeof categoryEnum]

type ReviewScore = {
  id: string
  overallReviewId: string
  overallScore: number
  category: CategoryEnum
}

type RadarChartProps = {
  scores: ReviewScore[]
}

const CATEGORIES = Object.values(categoryEnum)
const DEFAULT_SCORE = 10
const MAX_SCORE = 10

export const RadarChart = ({ scores }: RadarChartProps) => {
  // Prepare data with default values (using useMemo to prevent recalculation)
  const chartData = useMemo(() => {
    const dataMap = new Map<CategoryEnum, number>()

    // Initialize all categories with default score
    for (const category of CATEGORIES) {
      dataMap.set(category, DEFAULT_SCORE)
    }

    // Update with actual scores
    for (const score of scores) {
      dataMap.set(score.category, score.overallScore)
    }

    return dataMap
  }, [scores])

  // SVG size and center point
  const size = 400
  const center = size / 2
  const radius = center * 0.6

  // Calculate angle and coordinates for each category
  const categoryPoints = useMemo(() => {
    if (scores.length === 0) return []

    return CATEGORIES.map((category, i) => {
      const angle = (i * 2 * Math.PI) / CATEGORIES.length - Math.PI / 2
      const score = chartData.get(category) || DEFAULT_SCORE
      const normalizedScore = score / MAX_SCORE
      const x = center + radius * normalizedScore * Math.cos(angle)
      const y = center + radius * normalizedScore * Math.sin(angle)

      return {
        category,
        angle,
        score,
        x,
        y,
        labelX: center + (radius + 40) * Math.cos(angle),
        labelY: center + (radius + 60) * Math.sin(angle),
        scoreX: center + (radius * normalizedScore + 15) * Math.cos(angle),
        scoreY: center + (radius * normalizedScore + 15) * Math.sin(angle),
        axisX: center + radius * Math.cos(angle),
        axisY: center + radius * Math.sin(angle),
        id: `${category}-${i}`,
      }
    })
  }, [chartData, center, radius, scores.length])

  // Generate polygon points string
  const polygonPoints = useMemo(() => {
    return categoryPoints.map((point) => `${point.x},${point.y}`).join(' ')
  }, [categoryPoints])

  if (scores.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.noScores}>No scores available.</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${size} ${size}`}
        width="100%"
        height="100%"
        aria-label="Migration Health Radar Chart"
      >
        <title>Migration Health Radar Chart</title>
        {/* Background concentric circles */}
        {[1, 2, 3, 4, 5].map((i) => (
          <circle
            key={`circle-level-${i}`}
            cx={center}
            cy={center}
            r={(radius * i) / 5}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill="#FFD74819"
          stroke="#FFD74866"
          strokeWidth="2"
        />

        {/* Axis lines and labels */}
        {categoryPoints.map((point) => (
          <g key={`axis-${point.id}`}>
            <line
              x1={center}
              y1={center}
              x2={point.axisX}
              y2={point.axisY}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1"
            />
            <text
              x={point.labelX}
              y={point.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="14"
            >
              {point.category.replace(/_/g, ' ')}
            </text>
          </g>
        ))}

        {/* Data points and score labels */}
        {categoryPoints.map((point) => (
          <g key={`point-${point.id}`}>
            <text
              x={point.scoreX}
              y={point.scoreY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="14"
              fontWeight="bold"
            >
              {point.score}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
