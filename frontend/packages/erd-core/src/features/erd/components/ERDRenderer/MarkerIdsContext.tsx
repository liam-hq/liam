import { createContext, useContext } from 'react'

type MarkerIds = {
  zeroOrOneLeftId: string
  zeroOrOneLeftHighlightId: string
  zeroOrOneRightId: string
  zeroOrOneRightHighlightId: string
  zeroOrManyLeftId: string
  zeroOrManyLeftHighlightId: string
  gradientId: string
}

const MarkerIdsContext = createContext<MarkerIds | null>(null)

export const MarkerIdsProvider = MarkerIdsContext.Provider

export const useMarkerIds = (): MarkerIds => {
  const context = useContext(MarkerIdsContext)
  // In this context, the provider is always present in ERDRenderer
  // Using non-null assertion since this is a programming error if not provided
  return context!
}
