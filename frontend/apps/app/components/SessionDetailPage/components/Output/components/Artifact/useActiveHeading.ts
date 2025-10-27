'use client'

import { useEffect, useRef, useState } from 'react'

type Options = {
  elementIds: string[]
}

export const useActiveHeading = ({ elementIds }: Options) => {
  const [activeId, setActiveId] = useState('')
  const visibleHeadingsRef = useRef<IntersectionObserverEntry[]>([])

  useEffect(() => {
    const getIndexFromId = (id: string) => {
      return elementIds.indexOf(id)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleHeadingsRef.current.push(entry)
          } else {
            visibleHeadingsRef.current = visibleHeadingsRef.current.filter(
              (heading) => heading.target.id !== entry.target.id,
            )
          }
        })

        const visibleHeadings = visibleHeadingsRef.current

        if (visibleHeadings.length === 1) {
          setActiveId(visibleHeadings[0]?.target.id ?? '')
        } else if (visibleHeadings.length > 1) {
          const sortedVisibleHeadings = visibleHeadings.sort((a, b) => {
            return getIndexFromId(a.target.id) - getIndexFromId(b.target.id)
          })
          setActiveId(sortedVisibleHeadings[0]?.target.id ?? '')
        }
      },
      {
        // Mark a heading as "active" only after it is no longer
        // hidden behind fixed headers. Shrink the top margin by the
        // combined height of AppBar + Header + Artifact.head (e.g., ~150px).
        // Shrink the bottom by 70% to avoid early activation and bias
        // detection toward the upper area of the viewport.
        rootMargin: '-150px 0px -70% 0px',
      },
    )

    elementIds.forEach((id) => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      observer.disconnect()
      visibleHeadingsRef.current = []
    }
  }, [elementIds])

  return {
    activeId,
  }
}
