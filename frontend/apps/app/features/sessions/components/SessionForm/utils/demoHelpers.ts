// Demo-specific helpers for development and testing purposes
// This module should not be imported in production builds

export const DEMO_NETWORK_DELAY = 1000 // milliseconds

export const simulateNetworkDelay = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, DEMO_NETWORK_DELAY))
}

export const checkDemoErrorConditions = (
  url: string,
): { hasError: boolean; error?: string } => {
  if (url.includes('parse-error')) {
    return {
      hasError: true,
      error:
        'Schema parsing failed: Invalid syntax detected in the schema file.',
    }
  }

  if (url.includes('format-error')) {
    return {
      hasError: true,
      error:
        'Unsupported schema format. Please ensure the file matches its extension.',
    }
  }

  return { hasError: false }
}

export const getDemoSchemaContent = (): string => {
  return '-- Sample schema content\nCREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(255)\n);'
}
