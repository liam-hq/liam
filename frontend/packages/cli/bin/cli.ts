#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import inquirer from 'inquirer'
import { program } from '../src/index.js'

type WorkflowType = 'dsl' | 'pg_dump' | 'unsupported'

// Helper function to generate workflows
function generateWorkflow(type: WorkflowType) {
  const workflows = {
    dsl: 'Generating GitHub Actions Workflow for DSL-based parsing and ER build...',
    pg_dump: 'Generating GitHub Actions Workflow for pg_dump and ERD build...',
    unsupported:
      'Error: Not supported. Please visit our documentation or discussion for help.',
  }
  console.info(workflows[type])

  if (type !== 'unsupported') {
    const fileName = 'liam-erd-workflow.yml'
    const filePath = path.resolve(process.cwd(), fileName)
    fs.writeFile(
      filePath,
      `# Example workflow for ${type}
# This is a placeholder for the actual workflow content.`,
    )
    console.info(`Workflow generated: ${filePath}`)
  }
}

type DatabaseOrOrmTitle =
  | 'Ruby on Rails'
  | 'PostgreSQL'
  | 'Prisma'
  | 'Drizzle'
  | 'Other'
type DatabaseOrOrmParseStrategy = 'nativeParsing' | 'usePgDump' | 'unsupported'
type DatabaseOrOrm = {
  title: DatabaseOrOrmTitle
  parseStrategy: DatabaseOrOrmParseStrategy
}

const databaseOrOrms: DatabaseOrOrm[] = [
  { title: 'Ruby on Rails', parseStrategy: 'nativeParsing' },
  { title: 'PostgreSQL', parseStrategy: 'usePgDump' },
  { title: 'Prisma', parseStrategy: 'unsupported' },
  { title: 'Drizzle', parseStrategy: 'unsupported' },
  { title: 'Other', parseStrategy: 'unsupported' },
]

async function runSetup() {
  const databaseOrOrmTitles = databaseOrOrms.map(
    (databaseOrOrm) => databaseOrOrm.title,
  )
  const { databaseOrOrm } = (await inquirer.prompt([
    {
      type: 'list',
      name: 'databaseOrOrm',
      message: 'Select Database or ORM:',
      choices: databaseOrOrmTitles,
    },
  ])) as { databaseOrOrm: DatabaseOrOrmTitle }
  console.info(`Selected: ${databaseOrOrm}`)

  const databaseOrOrm2 = databaseOrOrms.find((d) => d.title === databaseOrOrm)
  if (databaseOrOrm2 === undefined) {
    return
  }
  if (databaseOrOrm2.parseStrategy === 'nativeParsing') {
    generateWorkflow('dsl')
    return
  }
  if (databaseOrOrm2.parseStrategy === 'usePgDump') {
    generateWorkflow('pg_dump')
  } else {
    generateWorkflow('unsupported')
  }
}

program
  .command('init')
  .description('Initialize the setup process for your database or ORM')
  .action(async () => {
    console.info('Welcome to the @liam-hq/cli setup process!')
    await runSetup()
  })

program.parse(process.argv)
