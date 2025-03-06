import { dbStructureSchema } from '@liam-hq/db-structure'
import {
  ERDRenderer,
  VersionProvider,
  initDBStructureStore,
  versionSchema,
} from '@liam-hq/erd-core'
import * as v from 'valibot'

async function loadSchemaContent() {
  try {
    const response = await fetch('./schema.json')
    if (!response.ok) {
      throw new Error(`Failed to fetch schema: ${response.statusText}`)
    }
    const data = await response.json()
    const result = v.safeParse(dbStructureSchema, data)
    result.success
      ? initDBStructureStore(result.output)
      : console.info(result.issues)
  } catch (error) {
    console.error('Error loading schema content:', error)
  }
}

loadSchemaContent()

const versionData = {
  version: import.meta.env.VITE_CLI_VERSION_VERSION,
  gitHash: import.meta.env.VITE_CLI_VERSION_GIT_HASH,
  envName: import.meta.env.VITE_CLI_VERSION_ENV_NAME,
  isReleasedGitHash:
    import.meta.env.VITE_CLI_VERSION_IS_RELEASED_GIT_HASH === '1',
  date: import.meta.env.VITE_CLI_VERSION_DATE,
  displayedOn: 'cli',
}
const version = v.parse(versionSchema, versionData)

function getSidebarSettingsFromCookie(): {
  isOpen: boolean
  panelSizes: number[]
} {
  const cookies = document.cookie.split('; ')
  const sidebarCookie = cookies.find((cookie) =>
    cookie.startsWith('sidebar:state='),
  )
  const layoutCookie = cookies.find((cookie) =>
    cookie.startsWith('panels:layout='),
  )

  const isOpen = sidebarCookie ? sidebarCookie.split('=')[1] === 'true' : false
  let panelSizes = [20, 80]

  if (layoutCookie) {
    try {
      const sizes = JSON.parse(layoutCookie.split('=')[1])
      if (Array.isArray(sizes) && sizes.length >= 2) {
        panelSizes = sizes
      }
    } catch {
      // Use default values if parsing fails
    }
  }

  return {
    isOpen,
    panelSizes,
  }
}

function App() {
  const { isOpen: defaultSidebarOpen, panelSizes } =
    getSidebarSettingsFromCookie()

  return (
    <VersionProvider version={version}>
      <ERDRenderer
        defaultSidebarOpen={defaultSidebarOpen}
        defaultPanelSizes={panelSizes}
      />
    </VersionProvider>
  )
}

export default App
