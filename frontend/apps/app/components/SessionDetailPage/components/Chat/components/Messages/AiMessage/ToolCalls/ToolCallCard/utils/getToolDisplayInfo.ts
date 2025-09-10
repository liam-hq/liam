/**
 * Get display information for a tool
 */
export function getToolDisplayInfo(
  toolName: string,
  _parsedArgs?: Record<string, unknown>,
): {
  displayName: string
  description?: string
} {
  // Tool name mappings for better display
  const toolDisplayNames: Record<string, string> = {
    // Schema tools
    saveSchema: 'Save Schema',
    fetchSchema: 'Fetch Schema',
    analyzeSchema: 'Analyze Schema',

    // Migration tools
    executeMigration: 'Execute Migration',
    generateMigration: 'Generate Migration',

    // Test tools
    saveTestcases: 'Save Test Cases',
    saveTestcasesAndDml: 'Save Test Cases & DML',
    executeTest: 'Execute Test',

    // Navigation
    routeToAgent: 'Route to Agent',

    // General
    searchDatabase: 'Search Database',
    queryDatabase: 'Query Database',
    createTable: 'Create Table',
    updateTable: 'Update Table',
    deleteTable: 'Delete Table',
  }

  const displayName =
    toolDisplayNames[toolName] ||
    toolName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim()

  return {
    displayName,
  }
}
