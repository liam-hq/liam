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

function getSidebarSettingsFromCookie(): { isOpen: boolean; width: number } {
  const cookies = document.cookie.split('; ').map((cookie) => cookie.split('='))

  const stateCookie = cookies.find(([key]) => key === 'sidebar:state')
  const widthCookie = cookies.find(([key]) => key === 'sidebar:width')

  return {
    isOpen: stateCookie ? stateCookie[1] === 'true' : false,
    width: widthCookie ? Number.parseInt(widthCookie[1], 10) || 20 : 20,
  }
}

function App() {
  const { isOpen: defaultSidebarOpen, width: defaultSidebarWidth } =
    getSidebarSettingsFromCookie()

  return (
    <VersionProvider version={version}>
      <ERDRenderer
        defaultSidebarOpen={defaultSidebarOpen}
        defaultSidebarWidth={defaultSidebarWidth}
      />
    </VersionProvider>
  )
}

export default App
