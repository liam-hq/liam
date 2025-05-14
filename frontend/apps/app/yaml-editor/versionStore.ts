import { type Operation, compare } from 'fast-json-patch'
import * as yaml from 'js-yaml'
import { create } from 'zustand'

interface Version {
  id: number
  timestamp: Date
  title: string // Title for the version
  patch?: Operation[]
  reversePatch?: Operation[] // Reverse patch for undo operation
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
  undoVersion: (id: number) => void
  redoVersion: (id: number) => void
  updateVersionTitle: (id: number, title: string) => void
  updateCurrentYaml: (yaml: string) => void
}

// Sample initial YAML
const initialYaml = `
---
tables: 
  Account: 
    name: "Account"
    columns: 
      id: 
        name: "id"
        type: "text"
        default: "cuid(1)"
        notNull: true
        unique: true
        primary: true
        comment: null
        check: null
      user_id: 
        name: "user_id"
        type: "text"
        default: null
        notNull: true
        unique: false
        primary: false
        comment: null
        check: null
  Session: 
    name: "Session"
    columns: 
      id: 
        name: "id"
        type: "text"
        default: "cuid(1)"
        notNull: true
        unique: true
        primary: true
        comment: null
        check: null
      session_token: 
        name: "session_token"
        type: "text"
        default: null
        notNull: true
        unique: true
        primary: false
        comment: null
        check: null
tableGroups: 
`

export const useVersionStore = create<VersionState>((set, get) => ({
  // Initialize with Version1 by default
  versions: [
    {
      id: 1,
      timestamp: new Date(),
      title: 'change',
      fullContent: yaml.load(initialYaml) as Record<string, any>,
    },
  ],
  currentYaml: initialYaml,
  selectedVersionId: 1,
  hasUnsavedChanges: false,

  initializeStore: () => {
    // Create Version1 by default when initializing
    const initialVersion: Version = {
      id: 1,
      timestamp: new Date(),
      title: 'change',
      fullContent: yaml.load(initialYaml) as Record<string, any>,
    }

    set({
      versions: [initialVersion],
      currentYaml: initialYaml,
      selectedVersionId: 1,
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
        title: 'change',
        fullContent: currentJson as Record<string, any>,
      }

      set({
        versions: [newVersion, ...versions],
        selectedVersionId: newVersionId,
        hasUnsavedChanges: false,
      })
    } else {
      // Subsequent versions - store patch and reverse patch
      const latestVersion = versions[0]
      const latestJson = getVersionContent(versions, latestVersion.id)
      const patch = compare(latestJson, currentJson as Record<string, any>)
      const reversePatch = compare(
        currentJson as Record<string, any>,
        latestJson,
      )

      const newVersion: Version = {
        id: newVersionId,
        timestamp: new Date(),
        title: 'change',
        patch,
        reversePatch,
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
      // Check if we're in a browser environment before using window.confirm
      if (typeof window !== 'undefined') {
        if (
          !window.confirm(
            'You have unsaved changes. Are you sure you want to switch versions?',
          )
        ) {
          return
        }
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
    const reversePatch = compare(content, latestContent)
    const newVersionId = versions.length + 1

    const newVersion: Version = {
      id: newVersionId,
      timestamp: new Date(),
      title: `undo: Version ${id}`,
      patch,
      reversePatch,
    }

    set({
      versions: [newVersion, ...versions],
      selectedVersionId: newVersionId,
      currentYaml: yaml.dump(content),
      hasUnsavedChanges: false,
    })
  },

  undoVersion: (id: number) => {
    const { versions } = get()

    // Find the version to undo
    const versionIndex = versions.findIndex((v) => v.id === id)
    if (versionIndex === -1) return

    const versionToUndo = versions[versionIndex]

    // If the version doesn't have a reversePatch, we can't undo it
    if (!versionToUndo.reversePatch) return

    // Get the latest content
    const latestVersion = versions[0]
    const latestContent = getVersionContent(versions, latestVersion.id)

    // Apply the reverse patch to get the undone content
    const undoneContent = JSON.parse(JSON.stringify(latestContent))
    versionToUndo.reversePatch.forEach((op) => {
      try {
        // Handle different operation types
        if (op.op === 'replace') {
          const path = op.path.split('/').filter((p) => p)
          let current = undoneContent
          for (let j = 0; j < path.length - 1; j++) {
            if (current[path[j]] === undefined) {
              current[path[j]] = {}
            }
            current = current[path[j]]
          }
          current[path[path.length - 1]] = op.value
        } else if (op.op === 'add') {
          const path = op.path.split('/').filter((p) => p)
          let current = undoneContent
          for (let j = 0; j < path.length - 1; j++) {
            if (current[path[j]] === undefined) {
              current[path[j]] = {}
            }
            current = current[path[j]]
          }
          current[path[path.length - 1]] = op.value
        } else if (op.op === 'remove') {
          const path = op.path.split('/').filter((p) => p)
          let current = undoneContent
          for (let j = 0; j < path.length - 1; j++) {
            if (current[path[j]] === undefined) {
              return // Path doesn't exist, nothing to remove
            }
            current = current[path[j]]
          }
          delete current[path[path.length - 1]]
        }
      } catch (error) {
        console.error('Error applying reverse patch operation:', op, error)
      }
    })

    // Create a new version with the undone content
    const patch = compare(latestContent, undoneContent)
    const reversePatch = compare(undoneContent, latestContent)
    const newVersionId = versions.length + 1

    const newVersion: Version = {
      id: newVersionId,
      timestamp: new Date(),
      title: `undo: Version ${id}`,
      patch,
      reversePatch,
    }

    set({
      versions: [newVersion, ...versions],
      selectedVersionId: newVersionId,
      currentYaml: yaml.dump(undoneContent),
      hasUnsavedChanges: false,
    })
  },

  redoVersion: (id: number) => {
    const { versions } = get()

    // Find the version to redo
    const versionIndex = versions.findIndex((v) => v.id === id)
    if (versionIndex === -1) return

    const versionToRedo = versions[versionIndex]

    // If the version doesn't have a patch, we can't redo it
    if (!versionToRedo.patch) return

    // Get the latest content
    const latestVersion = versions[0]
    const latestContent = getVersionContent(versions, latestVersion.id)

    // Apply the forward patch to get the redone content
    const redoneContent = JSON.parse(JSON.stringify(latestContent))
    versionToRedo.patch.forEach((op) => {
      try {
        // Handle different operation types
        if (op.op === 'replace') {
          const path = op.path.split('/').filter((p) => p)
          let current = redoneContent
          for (let j = 0; j < path.length - 1; j++) {
            if (current[path[j]] === undefined) {
              current[path[j]] = {}
            }
            current = current[path[j]]
          }
          current[path[path.length - 1]] = op.value
        } else if (op.op === 'add') {
          const path = op.path.split('/').filter((p) => p)
          let current = redoneContent
          for (let j = 0; j < path.length - 1; j++) {
            if (current[path[j]] === undefined) {
              current[path[j]] = {}
            }
            current = current[path[j]]
          }
          current[path[path.length - 1]] = op.value
        } else if (op.op === 'remove') {
          const path = op.path.split('/').filter((p) => p)
          let current = redoneContent
          for (let j = 0; j < path.length - 1; j++) {
            if (current[path[j]] === undefined) {
              return // Path doesn't exist, nothing to remove
            }
            current = current[path[j]]
          }
          delete current[path[path.length - 1]]
        }
      } catch (error) {
        console.error('Error applying forward patch operation:', op, error)
      }
    })

    // Create a new version with the redone content
    const patch = compare(latestContent, redoneContent)
    const reversePatch = compare(redoneContent, latestContent)
    const newVersionId = versions.length + 1

    const newVersion: Version = {
      id: newVersionId,
      timestamp: new Date(),
      title: `redo: Version ${id}`,
      patch,
      reversePatch,
    }

    set({
      versions: [newVersion, ...versions],
      selectedVersionId: newVersionId,
      currentYaml: yaml.dump(redoneContent),
      hasUnsavedChanges: false,
    })
  },

  updateVersionTitle: (id: number, title: string) => {
    const { versions } = get()
    const versionIndex = versions.findIndex((v) => v.id === id)
    if (versionIndex === -1) return

    // Create a new versions array with the updated title
    const updatedVersions = [...versions]
    updatedVersions[versionIndex] = {
      ...updatedVersions[versionIndex],
      title,
    }

    set({
      versions: updatedVersions,
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

  // Get the selected version
  const selectedVersion = versions[versionIndex]

  // If the selected version has fullContent (it's the base version), return it directly
  if (selectedVersion.fullContent) {
    return selectedVersion.fullContent
  }

  // Find the base version (the oldest one with full content)
  const baseVersionIndex = versions.findIndex(
    (v) => v.fullContent !== undefined,
  )
  if (baseVersionIndex === -1) return null

  const baseVersion = versions[baseVersionIndex]
  // Create a deep copy of the base content to avoid modifying the original
  const content = JSON.parse(JSON.stringify(baseVersion.fullContent))

  // Sort versions by ID to ensure correct patch application order
  const sortedVersions = [...versions].sort((a, b) => a.id - b.id)

  // Find the index of the base version and selected version in the sorted array
  const sortedBaseIndex = sortedVersions.findIndex(
    (v) => v.id === baseVersion.id,
  )
  const sortedSelectedIndex = sortedVersions.findIndex(
    (v) => v.id === selectedVersion.id,
  )

  // Apply patches in order from the base version up to the selected version
  for (let i = sortedBaseIndex + 1; i <= sortedSelectedIndex; i++) {
    const version = sortedVersions[i]
    if (version.patch) {
      // Apply each operation in the patch
      version.patch.forEach((op) => {
        try {
          // Handle different operation types
          if (op.op === 'replace') {
            const path = op.path.split('/').filter((p) => p)
            let current = content
            for (let j = 0; j < path.length - 1; j++) {
              if (current[path[j]] === undefined) {
                current[path[j]] = {}
              }
              current = current[path[j]]
            }
            current[path[path.length - 1]] = op.value
          } else if (op.op === 'add') {
            const path = op.path.split('/').filter((p) => p)
            let current = content
            for (let j = 0; j < path.length - 1; j++) {
              if (current[path[j]] === undefined) {
                current[path[j]] = {}
              }
              current = current[path[j]]
            }
            current[path[path.length - 1]] = op.value
          } else if (op.op === 'remove') {
            const path = op.path.split('/').filter((p) => p)
            let current = content
            for (let j = 0; j < path.length - 1; j++) {
              if (current[path[j]] === undefined) {
                return // Path doesn't exist, nothing to remove
              }
              current = current[path[j]]
            }
            delete current[path[path.length - 1]]
          }
          // Additional operations like "move", "copy", etc. could be implemented here
        } catch (error) {
          console.error('Error applying patch operation:', op, error)
        }
      })
    }
  }

  return content
}
