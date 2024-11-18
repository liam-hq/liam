import fs from 'node:fs'
import path from 'node:path'

// TODO: remove this
const fixtureObject = {
  tables: {
    users: {
      name: 'users',
      x: 100,
      y: 200,
      fields: [
        {
          name: 'id',
          type: 'integer',
          default: '',
          check: '',
          primary: true,
          unique: false,
          notNull: true,
          increment: true,
          comment: 'Primary key',
        },
        {
          name: 'username',
          type: 'varchar',
          default: '',
          check: '',
          primary: false,
          unique: true,
          notNull: true,
          increment: false,
          comment: "User's unique username",
        },
      ],
      comment: 'Table storing user data',
      indices: [
        {
          name: 'idx_users_username',
          unique: true,
          fields: ['username'],
        },
      ],
      color: '#ffcc00',
    },
    posts: {
      name: 'posts',
      x: 300,
      y: 400,
      fields: [
        {
          name: 'id',
          type: 'integer',
          default: '',
          check: '',
          primary: true,
          unique: false,
          notNull: true,
          increment: true,
          comment: 'Primary key',
        },
        {
          name: 'title',
          type: 'varchar',
          default: '',
          check: '',
          primary: false,
          unique: false,
          notNull: true,
          increment: false,
          comment: 'Post title',
        },
      ],
      comment: 'Table storing posts data',
      indices: [
        {
          name: 'idx_posts_title',
          unique: false,
          fields: ['title'],
        },
      ],
      color: '#99ccff',
    },
  },
  relationships: {},
}

export function runPreprocess(inputPath: string | null, publicDir: string) {
  if (inputPath && !fs.existsSync(inputPath)) {
    throw new Error('Invalid input path. Please provide a valid .sql file.')
  }

  // TODO: use the inputPath
  const filePath = path.join(publicDir, 'schema.json')

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  try {
    const jsonContent = JSON.stringify(fixtureObject, null, 2)
    fs.writeFileSync(filePath, jsonContent, 'utf8')
    return filePath
  } catch (error) {
    console.error(
      `Error during preprocessing: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    return null
  }
}