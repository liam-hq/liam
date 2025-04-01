import { PromptTemplate } from '@langchain/core/prompts'
import { SYSTEM_PROMPT, USER_PROMPT, reviewJsonSchema } from '@liam-hq/jobs'
import promptfoo from 'promptfoo'

interface SchemaFile {
  filename: string
  content: string
}

interface SchemaChange {
  filename: string
  status: string
  changes: number
  patch: string
}

interface PromptVars {
  docsContent: string
  schemaFiles: SchemaFile[]
  schemaChanges: SchemaChange[]
}

const systemPrompt = (_vars: PromptVars) => {
  return SYSTEM_PROMPT
}

const userPrompt = async (vars: PromptVars) => {
  const template = PromptTemplate.fromTemplate(USER_PROMPT)
  const promptString = (
    await template.formatPromptValue({
      docsContent: vars.docsContent,
      schemaFiles: vars.schemaFiles,
      schemaChanges: vars.schemaChanges,
    })
  ).value
  return promptString
}

const promptFunction = async ({ vars }: { vars: PromptVars }) => [
  {
    role: 'system',
    content: systemPrompt(vars),
  },
  {
    role: 'user',
    content: await userPrompt(vars),
  },
]

async function main() {
  const results = await promptfoo.evaluate(
    {
      prompts: [promptFunction],
      defaultTest: {
        options: {
          // this is for llm-rubric
          provider: 'openai:gpt-4o-mini',
        },
      },
      providers: [
        {
          id: 'openai:gpt-4o-mini',
          config: {
            responseFormat: {
              type: 'json_schema',
              schema: reviewJsonSchema,
              strict: true,
            },
            temperature: 0.7,
          },
        },
      ],
      tests: [
        // # liam-hq/liam/pull/1055
        {
          vars: {
            docsContent: '',
            schemaFiles: [
              {
                filename: 'frontend/packages/db/prisma/schema.prisma',
                content:
                  'datasource db {\n  provider = "postgresql"\n  // NOTE: Use the non-pooling URL to avoid PrismaClientUnknownRequestError for now\n  url      = env("POSTGRES_URL_NON_POOLING")\n}\n\ngenerator client {\n  provider      = "prisma-client-js"\n  binaryTargets = ["native", "rhel-openssl-3.0.x", "debian-openssl-3.0.x"]\n}\n\nmodel Project {\n  id        Int      @id @default(autoincrement())\n  name      String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  reviews   OverallReview[]\n  repositoryMappings ProjectRepositoryMapping[]\n  watchSchemaFilePatterns WatchSchemaFilePattern[]\n  knowledgeSuggestions KnowledgeSuggestion[]\n  githubDocFilePaths GitHubDocFilePath[]\n}\n\nmodel Repository {\n  id             Int      @id @default(autoincrement())\n  name           String\n  owner          String\n  installationId BigInt\n  isActive       Boolean  @default(true)\n  createdAt      DateTime @default(now())\n  updatedAt      DateTime @updatedAt\n\n  pullRequests   PullRequest[]\n  projectMappings ProjectRepositoryMapping[]\n\n  @@unique([owner, name])\n}\n\nmodel PullRequest {\n  id             Int      @id @default(autoincrement())\n  pullNumber     BigInt\n  commentId      BigInt?\n  createdAt      DateTime @default(now())\n  updatedAt      DateTime @updatedAt\n  migration Migration?\n  repositoryId   Int\n  repository     Repository @relation(fields: [repositoryId], references: [id])\n  reviews        OverallReview[]\n\n  @@unique([repositoryId, pullNumber])\n}\n\nmodel Migration {\n  id             Int         @id @default(autoincrement())\n  title          String\n  pullRequestId  Int         @unique\n  pullRequest    PullRequest @relation(fields: [pullRequestId], references: [id])\n  createdAt       DateTime  @default(now())\n  updatedAt       DateTime  @updatedAt\n}\n\nmodel OverallReview {\n  id            Int     @id @default(autoincrement())\n  projectId     Int?\n  project       Project?    @relation(fields: [projectId], references: [id])\n  pullRequestId Int\n  pullRequest   PullRequest @relation(fields: [pullRequestId], references: [id])\n  branchName    String\n  reviewComment String?\n  reviewedAt    DateTime   @default(now())\n  createdAt       DateTime  @default(now())\n  updatedAt       DateTime  @updatedAt\n}\n\nmodel ProjectRepositoryMapping {\n  id           Int        @id @default(autoincrement())\n  projectId    Int\n  project      Project    @relation(fields: [projectId], references: [id])\n  repositoryId Int\n  repository   Repository @relation(fields: [repositoryId], references: [id])\n  createdAt    DateTime   @default(now())\n  updatedAt    DateTime   @updatedAt\n\n  @@unique([projectId, repositoryId])\n}\n\nmodel WatchSchemaFilePattern {\n  id        Int      @id @default(autoincrement())\n  pattern   String\n  projectId Int\n  project   Project  @relation(fields: [projectId], references: [id])\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n\n\nenum KnowledgeType {\n  SCHEMA\n  DOCS\n}\n\nmodel KnowledgeSuggestion {\n  id             Int           @id @default(autoincrement())\n  type           KnowledgeType // Either Schema or Docs\n  title          String        // Used as commit message\n  path           String        // Target file path\n  content        String        // Full content of the new file\n  fileSha        String?       // SHA of the file to be updated (nullable)\n  branchName     String        // Branch name for GitHub operations\n  projectId      Int\n  project        Project       @relation(fields: [projectId], references: [id])\n  approvedAt     DateTime?     // Approval timestamp (null if not approved)\n  createdAt      DateTime      @default(now())\n  updatedAt      DateTime      @updatedAt\n}\n',
              },
            ],
            schemaChanges: [
              {
                filename: 'frontend/packages/db/prisma/schema.prisma',
                status: 'modified',
                changes: 12,
                patch:
                  '@@ -113,15 +113,3 @@ model KnowledgeSuggestion {\n   createdAt      DateTime      @default(now())\n   updatedAt      DateTime      @updatedAt\n }\n-\n-model GitHubDocFilePath {\n-  id             Int      @id @default(autoincrement())\n-  path           String   // File path in GitHub repository\n-  isReviewEnabled Boolean @default(true)  // Whether ReviewAgent should read this file\n-  projectId      Int\n-  project        Project  @relation(fields: [projectId], references: [id])\n-  createdAt      DateTime @default(now())\n-  updatedAt      DateTime @updatedAt\n-\n-  @@unique([path, projectId])  // Composite unique key to ensure no duplicate paths within a project\n-}',
              },
            ],
          },
          assert: [
            {
              type: 'llm-rubric',
              value: 'The report evaluates the **risk of data loss**.',
            },
            {
              type: 'is-json',
              // NOTE: a bit flaky for now. so, we're not asserting the json schema
              // value: reviewJsonSchema,
            },
            {
              // demo test for scoring evaluation
              type: 'javascript',
              value: 'JSON.parse(output).scores[0].value >= 3',
            },
            {
              type: 'cost',
              threshold: 0.008,
            },
          ],
        },
      ],
      writeLatestResults: true,
    },
    {
      maxConcurrency: 4,
      // NOTE: if you want to test the prompt without caching, set this to false
      // cache: false,
    },
  )
  // exit with 0 if all results are successful
  process.exit(results.results.every((r) => r.success) ? 0 : 1)
}

main().catch(console.error)
