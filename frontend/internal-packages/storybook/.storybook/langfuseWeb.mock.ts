// This file provides a mock implementation of the getLangfuseWeb function for Storybook
// It will be used by the preview.ts file to override the actual implementation

// Define the type for our mock
interface MockLangfuseWeb {
  score: (params: {
    traceId: string
    name: string
    value: number
  }) => Promise<void>
}

// Create a mock implementation that can be used in stories
const mockLangfuseWeb: MockLangfuseWeb = {
  score: async () => Promise.resolve(),
}

// Extend the Window interface to include our custom property
declare global {
  interface Window {
    __STORYBOOK_LANGFUSE_MOCK__?: MockLangfuseWeb
  }
}

// Export a mock version of the getLangfuseWeb function
export const getLangfuseWeb = () => {
  // Check if we're in Storybook
  if (typeof window !== 'undefined' && window.__STORYBOOK_LANGFUSE_MOCK__) {
    return window.__STORYBOOK_LANGFUSE_MOCK__
  }

  // Fallback to a simple mock if something goes wrong
  return mockLangfuseWeb
}
