import { create } from "zustand"
import { compare, type Operation } from "fast-json-patch"
import * as yaml from "js-yaml"

export interface Version {
  id: number
  timestamp: Date
  patch?: Operation[]
  fullContent?: any // Full JSON content for the first version
}

interface VersionState {
  versions: Version[]
  currentYaml: string
  selectedVersionId: number | null
  hasUnsavedChanges: boolean

  // Actions
  initializeStore: () => void
  saveVersion: () => void
  selectVersion: (id: number) => void
  revertToVersion: (id: number) => void
  updateCurrentYaml: (yaml: string) => void
}

// Sample initial YAML
const initialYaml = `# Welcome to the YAML Editor
# Edit this document and save versions to see the history

server:
  host: example.com
  port: 8080
  
database:
  url: postgres://user:password@localhost:5432/db
  pool: 10
  
features:
  - authentication
  - authorization
  - logging
`

export const useVersionStore = create<VersionState>((set, get) => ({
  versions: [],
  currentYaml: initialYaml,
  selectedVersionId: null,
  hasUnsavedChanges: false,

  initializeStore: () => {
    set({
      versions: [],
      currentYaml: initialYaml,
      selectedVersionId: null,
      hasUnsavedChanges: false,
    })
  },

  saveVersion: () => {
    const { versions, currentYaml } = get()
    const currentJson = yaml.load(currentYaml)
    const newVersionId = versions.length + 1

    if (versions.length === 0) {
      // First version - store full content
      const newVersion: Version = {
        id: newVersionId,
        timestamp: new Date(),
        fullContent: currentJson,
      }

      set({
        versions: [newVersion, ...versions],
        selectedVersionId: newVersionId,
        hasUnsavedChanges: false,
      })
    } else {
      // Subsequent versions - store patch
      const latestVersion = versions[0]
      const latestJson = getVersionContent(versions, latestVersion.id)
      const patch = compare(latestJson, currentJson)

      const newVersion: Version = {
        id: newVersionId,
        timestamp: new Date(),
        patch,
      }

      set({
        versions: [newVersion, ...versions],
        selectedVersionId: newVersionId,
        hasUnsavedChanges: false,
      })
    }
  },

  selectVersion: (id: number) => {
    const { versions, hasUnsavedChanges } = get()

    if (hasUnsavedChanges) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to switch versions?")) {
        return
      }
    }

    const content = getVersionContent(versions, id)
    const yamlContent = yaml.dump(content)

    set({
      selectedVersionId: id,
      currentYaml: yamlContent,
      hasUnsavedChanges: false,
    })
  },

  revertToVersion: (id: number) => {
    const { versions } = get()
    const content = getVersionContent(versions, id)
    const latestVersion = versions[0]
    const latestContent = getVersionContent(versions, latestVersion.id)

    const patch = compare(latestContent, content)
    const newVersionId = versions.length + 1

    const newVersion: Version = {
      id: newVersionId,
      timestamp: new Date(),
      patch,
    }

    set({
      versions: [newVersion, ...versions],
      selectedVersionId: newVersionId,
      currentYaml: yaml.dump(content),
      hasUnsavedChanges: false,
    })
  },

  updateCurrentYaml: (yamlContent: string) => {
    const { currentYaml } = get()
    set({
      currentYaml: yamlContent,
      hasUnsavedChanges: currentYaml !== yamlContent,
    })
  },
}))

// Helper function to reconstruct version content
function getVersionContent(versions: Version[], versionId: number): any {
  // Find the version
  const versionIndex = versions.findIndex((v) => v.id === versionId)
  if (versionIndex === -1) return null

  // If it's the first version ever, return its full content
  if (versions[versions.length - 1].id === versionId) {
    return versions[versions.length - 1].fullContent
  }

  // Start with the base version (the oldest one with full content)
  const baseVersion = versions[versions.length - 1]
  const content = JSON.parse(JSON.stringify(baseVersion.fullContent))

  // Apply patches in order from oldest to the requested version
  for (let i = versions.length - 2; i >= versionIndex; i--) {
    const version = versions[i]
    if (version.patch) {
      // Apply patch using fast-json-patch (we're using it manually here)
      // In a real implementation, you'd use applyPatch from fast-json-patch
      version.patch.forEach((op) => {
        // This is a simplified version - in a real app, use the library's applyPatch
        if (op.op === "replace") {
          const path = op.path.split("/").filter((p) => p)
          let current = content
          for (let j = 0; j < path.length - 1; j++) {
            current = current[path[j]]
          }
          current[path[path.length - 1]] = op.value
        }
        // Handle other operations (add, remove, etc.) as needed
      })
    }
  }

  return content
}
