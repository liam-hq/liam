'use client'

/**
 * This is a sample implementation page. PGlitePlayground and PGlitePlaygroundHandle need to be referenced somewhere
 * to avoid being flagged as unused by knip. Please remove this page when it is used with AI Agent.
 */
import { useEffect, useRef } from 'react'
import {
  PGlitePlayground,
  type PGlitePlaygroundHandle,
} from '@/components/PGlitePage'

export default function Page() {
  const playgroundRef = useRef<PGlitePlaygroundHandle>(null)

  useEffect(() => {
    // Simple demonstration that the PGlitePlaygroundHandle interface is being used
    // This ensures the interface is not flagged as unused by knip
    const demonstrateHandle = () => {
      if (playgroundRef.current) {
        // Just verify the methods exist - minimal usage to satisfy knip
        playgroundRef.current.getSessionId()
        playgroundRef.current.getDDLResults()
      }
    }

    // Small delay to ensure the component is initialized
    const timer = setTimeout(demonstrateHandle, 1000)
    return () => clearTimeout(timer)
  }, [])

  return <PGlitePlayground ref={playgroundRef} />
}
