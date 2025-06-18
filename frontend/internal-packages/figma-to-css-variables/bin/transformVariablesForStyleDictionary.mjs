import { promises as fs } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

/**
 * Retrieves the token value from the variable based on the mode.
 * @param {Object} variable
 * @param {string} modeId
 * @param {Object[]} localVariables
 * @returns {string|number}
 */
function tokenValueFromVariable(variable, modeId, localVariables) {
  const value = variable.valuesByMode[modeId]
  if (typeof value === 'object') {
    if ('type' in value && value.type === 'VARIABLE_ALIAS') {
      const aliasedVariable = localVariables[value.id]
      // console.log(aliasedVariable, value.id)
      return `{${aliasedVariable?.name.replace(/\//g, '.')}}`
    }
    if ('r' in value) {
      return rgbToHex(value) // Assuming rgbToHex is defined elsewhere
    }

    throw new Error(`Format of variable value is invalid: ${value}`)
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : Math.floor(value * 100) / 100
  }

  return value
}

function rgbToHex({ r, g, b, a }) {
  if (a === undefined) {
    a = 1
  }

  const toHex = (value) => {
    const hex = Math.round(value * 255).toString(16)
    return hex.length === 1 ? `0${hex}` : hex
  }

  const hex = [toHex(r), toHex(g), toHex(b)].join('')
  return `#${hex}${a !== 1 ? toHex(a) : ''}`
}

/**
 * Infers token type from the variable.
 * @param {Object} variable
 * @returns {string}
 */
function tokenTypeFromVariable(variable) {
  switch (variable.resolvedType) {
    case 'BOOLEAN':
      return 'boolean'
    case 'COLOR':
      return 'color'
    case 'FLOAT':
      return 'number'
    case 'STRING':
      return 'string'
  }
}

/**
 * Creates a nested object structure based on the variable name path.
 * @param {Object} fileContents
 * @param {string} filePath
 * @param {string} variableName
 * @returns {Object}
 */
function createNestedObjectPath(fileContents, filePath, variableName) {
  if (!fileContents[filePath]) {
    fileContents[filePath] = {}
  }

  let obj = fileContents[filePath]
  for (const groupName of variableName.split('/')) {
    obj[groupName] = obj[groupName] || {}
    obj = obj[groupName]
  }
  return obj
}

/**
 * Creates a token object from a variable.
 * @param {Object} variable
 * @param {string} modeId
 * @param {Object[]} localVariables
 * @returns {Object}
 */
function createTokenFromVariable(variable, modeId, localVariables) {
  return {
    type: tokenTypeFromVariable(variable),
    value: tokenValueFromVariable(variable, modeId, localVariables),
    description: variable.description || '',
    extensions: {
      'com.figma': {
        hiddenFromPublishing: variable.hiddenFromPublishing,
        scopes: variable.scopes,
        codeSyntax: variable.codeSyntax,
      },
    },
  }
}

/**
 * Processes a single variable for all its modes.
 * @param {Object} variable
 * @param {Object} collection
 * @param {Object} fileContents
 * @param {string} transformedDir
 * @param {Object[]} localVariables
 */
function processVariableForAllModes(
  variable,
  collection,
  fileContents,
  transformedDir,
  localVariables,
) {
  for (const mode of collection.modes) {
    const fileName = `${mode.name}/${collection.name}.json`
    const filePath = path.join(transformedDir, fileName)

    const obj = createNestedObjectPath(fileContents, filePath, variable.name)
    const token = createTokenFromVariable(variable, mode.modeId, localVariables)
    Object.assign(obj, token)
  }
}

/**
 * Writes all file contents to disk.
 * @param {Object} fileContents
 */
async function writeFileContents(fileContents) {
  for (const [filePath, content] of Object.entries(fileContents)) {
    const dir = path.dirname(filePath)
    await mkdir(dir, { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(content, null, 2))
  }
}

/**
 * Transforms Figma local variables into Style Dictionary format.
 * @returns {Promise<void>}
 */
export async function transformVariablesForStyleDictionary() {
  const localVariablesPath = 'tmp/local-variables.json'
  const transformedDir = 'tmp/transformed-variables'

  const data = JSON.parse(await fs.readFile(localVariablesPath, 'utf-8'))
  const localVariables = data.variables
  const localVariableCollections = data.variableCollections

  await mkdir(transformedDir, { recursive: true })

  const fileContents = {}

  for (const variable of Object.values(localVariables)) {
    if (variable.remote) continue // Skip remote variables

    const collection = localVariableCollections[variable.variableCollectionId]
    if (collection) {
      processVariableForAllModes(
        variable,
        collection,
        fileContents,
        transformedDir,
        localVariables,
      )
    }
  }

  await writeFileContents(fileContents)
}
