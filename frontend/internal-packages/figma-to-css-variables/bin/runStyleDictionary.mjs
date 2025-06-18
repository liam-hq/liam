import fs from 'node:fs'
import path from 'node:path'
import StyleDictionary from 'style-dictionary'

function isNumber(token) {
  const targets = [
    'size',
    'border-radius',
    'border-width',
    'spacing',
    'font-size',
    'line-height',
    'sizing',
  ]

  return (
    targets.includes(token.attributes?.category ?? '') ||
    targets.includes(token.attributes?.type ?? '')
  )
}

StyleDictionary.registerTransform({
  type: 'value',
  transitive: true,
  name: 'number/px',
  filter: isNumber,
  transform: (token) => {
    const val = Number.parseFloat(token.value)
    if (Number.isNaN(val))
      throw `Invalid Number: '${token.name}: ${token.value}' is not a valid number, cannot transform to 'px' \n`
    return `${val}px`
  },
})

function source(input) {
  return [`${input}/**/*.json`]
}

/**
 * Runs the Style Dictionary build process for each sub-directory found in the input directory.
 *
 * @param {string[]} filterDirNames - An array of directory names to filter and process.
 * @param {string} [outputPath='build/css'] - The output path where the CSS files will be generated.
 * @returns {Promise<void>} - A promise that resolves when the build process is complete.
 */
export async function runStyleDictionary(
  outputPath = 'build/css',
  filterDirNames = [],
) {
  try {
    const inputDir = path.resolve('tmp/transformed-variables')
    const subDirs = fs
      .readdirSync(inputDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .filter(
        (dirent) =>
          filterDirNames.length === 0 || filterDirNames.includes(dirent.name),
      )
      .map((dirent) => dirent.name)

    for (const subDir of subDirs) {
      const subDirInput = path.join(inputDir, subDir)
      const subDirOutput = `${path.join(outputPath, subDir)}/`

      /**
       * @type {import('style-dictionary').Config}
       */
      const config = {
        source: [source(subDirInput)],
        platforms: {
          css: {
            transformGroup: 'css',
            buildPath: subDirOutput,
            files: [
              {
                destination: 'variables.css',
                format: 'css/variables',
              },
            ],
            /**
             * Resetting the configuration to display size-related numbers in px.
             * The default settings are as follows:
             * @see: https://styledictionary.com/reference/hooks/transform-groups/predefined/
             */
            transforms: [
              'attribute/cti',
              'name/kebab',
              'time/seconds',
              'html/icon',
              'color/css',
              'number/px',
            ],
            options: {
              formatting: {
                fileHeaderTimestamp: true,
              },
            },
          },
        },
        log: {
          warnings: 'warn', // 'warn' | 'error' | 'disabled'
          verbosity: 'verbose', // 'default' | 'silent' | 'verbose'
          errors: {
            brokenReferences: 'console', // 'throw' | 'console'
          },
        },
      }

      const styleDictionary = new StyleDictionary(config)
      await styleDictionary.buildAllPlatforms()
    }
  } catch (_error) {}
}
