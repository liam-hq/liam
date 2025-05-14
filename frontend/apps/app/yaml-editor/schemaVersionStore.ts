import { type Operation, compare } from 'fast-json-patch'
import * as yaml from 'js-yaml'
import { create } from 'zustand'

// Type for version ID that can be either string or number
export type VersionId = number

interface SchemaVersion {
  id: string
  schemaId: string
  number: number
  createdAt: Date
  title: string
  patch?: Operation[]
  reversePatch?: Operation[]
  fullContent?: any // Full JSON content for the first version
}

interface SchemaVersionState {
  schemaId: string | null
  versions: SchemaVersion[]
  currentYaml: string
  selectedVersionNumber: number | null
  hasUnsavedChanges: boolean
  lastVersionCreatedAt: number | null // Track when the last version was created

  // Actions
  initializeStore: (schemaId: string) => void
  generateFirstVersion: () => Promise<SchemaVersion | undefined>
  loadVersions: () => Promise<void>
  saveVersion: () => Promise<SchemaVersion | undefined>
  selectVersion: (id: VersionId) => void
  revertToVersion: (id: VersionId) => void
  undoVersion: (id: VersionId) => void
  redoVersion: (id: VersionId) => void
  updateVersionTitle: (id: VersionId, title: string) => void
  updateCurrentYaml: (yaml: string) => void
}


const _initialYaml = `
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
`


export const useSchemaVersionStore = create<SchemaVersionState>((set, get) => ({
  schemaId: null,
  versions: [],
  currentYaml: "",
  selectedVersionNumber: null,
  hasUnsavedChanges: false,
  lastVersionCreatedAt: null,

  initializeStore: (schemaId: string) => {
    set({
      schemaId,
      versions: [],
      currentYaml: "",
      selectedVersionNumber: null,
      hasUnsavedChanges: false,
      lastVersionCreatedAt: null,
    })
  },

  generateFirstVersion: async () => {
    const { schemaId, versions } = get()
    if (!schemaId) return
    if (versions.length > 0) return
    const initialYaml = _initialYaml
    const initialYamlParsed = yaml.load(initialYaml) as Object
    const initialPatch = compare({}, initialYamlParsed)
    const latestVersionNumber = 0
    const title = "Initial version"
    const response = await fetch(`/api/schemas/${schemaId}/versions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        latestVersionNumber,
        title,
        patch: initialPatch,
      }),
    })
    const data = await response.json()
    if (!response.ok) {
      // console.error(response.statusText)
      // Handle error
      return undefined
    }
    const newVersion: SchemaVersion = {
      id: data.id,
      schemaId,
      number: data.number,
      createdAt: new Date(data.created_at),
      title: "Initial version",
      patch: data.patch,
      reversePatch: data.reverse_patch,
      fullContent: data.number === 1 ? yaml.load(initialYaml) : undefined,
    }
    set({
      versions: [newVersion],
      selectedVersionNumber: newVersion.number,
      currentYaml: initialYaml,
      hasUnsavedChanges: false,
      lastVersionCreatedAt: Date.now(), // Set the timestamp when the first version is created
    })
    return newVersion
  },

  loadVersions: async () => {
    const { schemaId } = get()
    if (!schemaId) return

    try {
      // Fetch versions from the database
      const response = await fetch(`/api/schemas/${schemaId}/versions`)
      
      if (!response.ok) {
        throw new Error(`Failed to load versions: ${response.statusText}`)
      }
      
      const data = (await response.json())

      // Apply the forward patch to get the redone content
      const f = (v: any) => {
        const redoneContent: any = {}
        const patch: Operation[] = v.patch
        patch.forEach((op) => {
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
        return redoneContent
      }


      // Check if data.versions exists and is an array
      if (data.versions && Array.isArray(data.versions) && data.versions.length > 0) {
        // Convert database versions to store versions
        const versions = data.versions.map((v: any) => ({
          id: v.id,
          schemaId: v.schema_id,
          number: v.number,
          createdAt: new Date(v.created_at),
          title: v.title,
          patch: v.patch,
          reversePatch: v.reverse_patch,
          // TODO: don't use _initialYaml here, read from data.versions[0]
          fullContent: v.number === 1 ? f(v)  : undefined,
          // fullContent: v.number === 1 ? undefined : undefined,
        }))
        
        // Sort versions by number in descending order
        versions.sort((a: SchemaVersion, b: SchemaVersion) => b.number - a.number)
        
        // Set the latest version as the selected version
        const latestVersion = versions[0]
        const content = getVersionContent(versions, latestVersion.number)
        const yamlContent = yaml.dump(content)
        
        set({
          versions,
          currentYaml: yamlContent,
          selectedVersionNumber: latestVersion.id,
          hasUnsavedChanges: false,
          lastVersionCreatedAt: Date.now(), // Set the timestamp when versions are loaded
        })
      } else {
        // No versions found, just set the initial YAML
        set({
          versions: [],
          currentYaml: "empty",
          selectedVersionNumber: null,
          hasUnsavedChanges: false,
          lastVersionCreatedAt: null,
        })
      }
    } catch (error) {
      console.error('Error loading versions:', error)
      
      // Just set the initial YAML in case of error
      set({
        versions: [],
        currentYaml: "",
        selectedVersionNumber: null,
        hasUnsavedChanges: false,
        lastVersionCreatedAt: null,
      })
    }
  },
  saveVersion: async () => {
    const { schemaId, versions, currentYaml, hasUnsavedChanges, lastVersionCreatedAt } = get()
    
    if (!schemaId) return
    
    // For the first version, we always want to create it regardless of hasUnsavedChanges
    // For subsequent versions, only create if there are unsaved changes
    const isFirstVersion = versions.length === 0
    if (!isFirstVersion && !hasUnsavedChanges) return

    // Prevent creating multiple versions in quick succession (within 2 seconds)
    const now = Date.now()
    if (lastVersionCreatedAt && now - lastVersionCreatedAt < 2000) {
      console.log('Version was just created, skipping duplicate creation')
      return versions.length > 0 ? versions[0] : undefined
    }
    
    try {
      const currentJson = yaml.load(currentYaml)

      // Check if we already have a version with the same content
      if (versions.length > 0) {
        const latestVersion = versions[0]
        const latestJson = getVersionContent(versions, latestVersion.number)
        
        // Compare the current content with the latest version's content
        if (latestJson) {
          // Convert both to strings for deep comparison
          const currentStr = JSON.stringify(currentJson)
          const latestStr = JSON.stringify(latestJson)
          
          // If the content is identical, don't create a new version
          if (currentStr === latestStr) {
            console.log('Content unchanged, skipping version creation')
            return latestVersion
          }
        }
      }

      let patch: Operation[] | undefined
      
      if (versions.length === 0) {
        // First version - store full content
        // No patches needed
        patch = []
      } else {
        // Subsequent versions - calculate patch
        const latestVersion = versions[0]
        const latestJson = getVersionContent(versions, latestVersion.number)
        
        // Make sure latestJson is not null or undefined before comparing
        if (latestJson) {
          patch = compare(latestJson, currentJson as Record<string, any>)
        } else {
          console.error('Latest JSON content is null or undefined')
          // Use empty patches if we can't get the latest content
          patch = []
        }
      }

      // Get the latest version number
      const latestVersionNumber = versions.length > 0 ? versions[0].number : 0

      // Save to the database using the API endpoint
      const response = await fetch(`/api/schemas/${schemaId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latestVersionNumber,
          title: 'change',
          patch
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        // Check if this is a version conflict
        if (response.status === 409 && data.latestVersionNumber) {
          // Handle version conflict by reloading versions
          console.warn('Version conflict detected, reloading versions')
          await get().loadVersions()
          
          // Notify the user about the conflict
          if (typeof window !== 'undefined') {
            window.alert('The schema has been modified by another user. Your changes have been preserved but not saved. Please review the latest version and try saving again.')
          }
          
          // Mark that there are unsaved changes
          set({ hasUnsavedChanges: true })
          return undefined
        }
        
        throw new Error(`Failed to save version: ${data.error || response.statusText}`)
      }
      
      // Add the new version to the store
      const newVersion: SchemaVersion = {
        id: data.id,
        schemaId,
        number: data.number,
        createdAt: new Date(data.created_at),
        title: 'change',
        patch: data.patch,
        reversePatch: data.reverse_patch,
        fullContent: data.number === 1 ? currentJson : undefined,
      }

      set({
        versions: [newVersion, ...versions],
        selectedVersionNumber: newVersion.number,
        hasUnsavedChanges: false,
        lastVersionCreatedAt: Date.now(), // Update the timestamp when a version is created
      })
        
        return newVersion
    } catch (error) {
      console.error('Error saving version:', error)
      throw error
    }
  },

  selectVersion: (versionNumber: VersionId) => {
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

    const content = getVersionContent(versions, versionNumber)
    
    // Make sure content is not null before dumping to YAML
    if (content) {
      const yamlContent = yaml.dump(content)
      
      set({
        selectedVersionNumber: versionNumber,
        currentYaml: yamlContent,
        hasUnsavedChanges: false,
      })
    } else {
      console.error('Failed to get content for version:', versionNumber)
    }
  },

  revertToVersion: (versionNumber: VersionId) => {
    const { versions, schemaId } = get()
    if (!schemaId) return
    
    const content = getVersionContent(versions, versionNumber)
    const latestVersion = versions[0]
    const latestContent = getVersionContent(versions, latestVersion.number)

    // Make sure content and latestContent are not null or undefined before comparing
    let patch: Operation[] = []
    let reversePatch: Operation[] = []
    
    if (content && latestContent) {
      patch = compare(latestContent, content)
      reversePatch = compare(content, latestContent)
    } else {
      console.error('Content or latestContent is null or undefined')
    }

    // Create a new version with the reverted content and save to the database
    get().updateCurrentYaml(yaml.dump(content))
    get().saveVersion()
  },

  undoVersion: (versionNumber: VersionId) => {
    const { versions, schemaId } = get()
    if (!schemaId) return

    // Find the version to undo
    const versionIndex = versions.findIndex((v) => v.number === versionNumber)
    if (versionIndex === -1) return

    const versionToUndo = versions[versionIndex]

    // If the version doesn't have a reversePatch, we can't undo it
    if (!versionToUndo.reversePatch) return

    // Get the latest content
    const latestVersion = versions[0]
    const latestContent = getVersionContent(versions, latestVersion.number)

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

    // Update the current YAML and save a new version
    get().updateCurrentYaml(yaml.dump(undoneContent))
    get().saveVersion()
  },

  redoVersion: (versionNumber: VersionId) => {
    const { versions, schemaId } = get()
    if (!schemaId) return

    // Find the version to redo
    const versionIndex = versions.findIndex((v) => v.number === versionNumber)
    if (versionIndex === -1) return

    const versionToRedo = versions[versionIndex]

    // If the version doesn't have a patch, we can't redo it
    if (!versionToRedo.patch) return

    // Get the latest content
    const latestVersion = versions[0]
    const latestContent = getVersionContent(versions, latestVersion.number)

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

    // Update the current YAML and save a new version
    get().updateCurrentYaml(yaml.dump(redoneContent))
    get().saveVersion()
  },

  updateVersionTitle: (versionNumber: VersionId, title: string) => {
    const { versions, schemaId } = get()
    if (!schemaId) return
    
    const versionIndex = versions.findIndex((v) => v.number === versionNumber)
    if (versionIndex === -1) return

    const version = versions.find((v) => v.number === versionNumber)
    if (!version) return

    // Update the title in the database
    fetch(`/api/schemas/${schemaId}/versions/${version.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    }).catch(error => {
      console.error('Error updating version title:', error)
    })

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
function getVersionContent(versions: SchemaVersion[], versionNumber: number): any {
  // Find the version
  const versionIndex = versions.findIndex((v) => v.number === versionNumber)
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

  // Sort versions by number to ensure correct patch application order
  const sortedVersions = [...versions].sort((a, b) => a.number - b.number)

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
