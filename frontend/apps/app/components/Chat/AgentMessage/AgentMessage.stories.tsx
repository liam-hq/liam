import { syntaxCodeTagProps, syntaxCustomStyle, syntaxTheme } from '@liam-hq/ui'
import type { Meta, StoryObj } from '@storybook/react'
import type { ComponentProps, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import remarkGfm from 'remark-gfm'
import {
  type MessageOption,
  MessageOptionButtons,
} from '../MessageOptionButtons'
import { AgentMessage } from './AgentMessage'

// Define the component props type
type AgentMessageProps = ComponentProps<typeof AgentMessage>

// Define CodeProps interface for markdown code blocks
type CodeProps = ComponentProps<'code'> & {
  node?: unknown
  inline?: boolean
  className?: string
  children?: ReactNode
}

const meta = {
  component: AgentMessage,
  title: 'Components/Chat/AgentMessage',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AgentMessage>

export default meta
type Story = StoryObj<AgentMessageProps>

export const BuildDefault: Story = {
  args: {
    agent: 'build',
    state: 'default',
    message:
      'We would like to make a proposal for the implementation of a chat UI. First, please allow me to check the current structure of the schema page.',
    time: '12:10',
    agentName: 'Build Agent',
  },
}

export const AskDefault: Story = {
  args: {
    agent: 'ask',
    state: 'default',
    message:
      'We would like to make a proposal for the implementation of a chat UI. First, please allow me to check the current structure of the schema page.',
    time: '12:10',
    agentName: 'Ask Agent',
  },
}

export const BuildWithCustomName: Story = {
  args: {
    agent: 'build',
    state: 'default',
    message: 'This is a message from a build agent with a custom name.',
    time: '12:20',
    agentName: 'Custom Build Agent',
  },
}

export const AskWithCustomName: Story = {
  args: {
    agent: 'ask',
    state: 'default',
    message: 'This is a message from an ask agent with a custom name.',
    time: '12:20',
    agentName: 'Custom Ask Agent',
  },
}

export const BuildGenerating: Story = {
  args: {
    agent: 'build',
    state: 'generating',
  },
}

export const AskGenerating: Story = {
  args: {
    agent: 'ask',
    state: 'generating',
  },
}

// Markdown content for the story
const markdownContent = `
# Markdown Example

This is an example of **markdown content** rendered as HTML in the AgentMessage component.

## Features

- Lists
- *Italic text*
- **Bold text**
- [Links](https://example.com)

### Ruby Schema (schema.rb)

\`\`\`ruby
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running \`bin/rails
# db:schema:load\`. When creating a new database, \`bin/rails db:schema:load\` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.0].define(version: 2023_05_15_123456) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"
  enable_extension "uuid-ossp"
  enable_extension "pgcrypto"

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "encrypted_password", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string "unconfirmed_email"
    t.string "first_name"
    t.string "last_name"
    t.boolean "admin", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "projects", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "deleted_at"
    t.string "status", default: "active"
    t.index ["deleted_at"], name: "index_projects_on_deleted_at"
    t.index ["user_id"], name: "index_projects_on_user_id"
  end

  create_table "tasks", force: :cascade do |t|
    t.string "title", null: false
    t.text "description"
    t.bigint "project_id", null: false
    t.bigint "assigned_to_id"
    t.string "status", default: "pending"
    t.date "due_date"
    t.integer "priority", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["assigned_to_id"], name: "index_tasks_on_assigned_to_id"
    t.index ["project_id"], name: "index_tasks_on_project_id"
  end

  create_table "comments", force: :cascade do |t|
    t.text "content", null: false
    t.bigint "user_id", null: false
    t.bigint "task_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["task_id"], name: "index_comments_on_task_id"
    t.index ["user_id"], name: "index_comments_on_user_id"
  end

  create_table "attachments", force: :cascade do |t|
    t.string "file_name", null: false
    t.string "content_type"
    t.integer "file_size"
    t.string "file_path", null: false
    t.references "attachable", polymorphic: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "projects", "users"
  add_foreign_key "tasks", "projects"
  add_foreign_key "tasks", "users", column: "assigned_to_id"
  add_foreign_key "comments", "tasks"
  add_foreign_key "comments", "users"
end
\`\`\`

### PostgreSQL Schema

\`\`\`sql
-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    encrypted_password VARCHAR(255) NOT NULL,
    reset_password_token VARCHAR(255),
    reset_password_sent_at TIMESTAMP,
    remember_created_at TIMESTAMP,
    sign_in_count INTEGER NOT NULL DEFAULT 0,
    current_sign_in_at TIMESTAMP,
    last_sign_in_at TIMESTAMP,
    current_sign_in_ip VARCHAR(255),
    last_sign_in_ip VARCHAR(255),
    confirmation_token VARCHAR(255),
    confirmed_at TIMESTAMP,
    confirmation_sent_at TIMESTAMP,
    unconfirmed_email VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users table
CREATE UNIQUE INDEX index_users_on_email ON users (email);
CREATE UNIQUE INDEX index_users_on_reset_password_token ON users (reset_password_token);
CREATE UNIQUE INDEX index_users_on_confirmation_token ON users (confirmation_token);

-- Projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active'
);

-- Create indexes for projects table
CREATE INDEX index_projects_on_user_id ON projects (user_id);
CREATE INDEX index_projects_on_deleted_at ON projects (deleted_at);

-- Tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending',
    due_date DATE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for tasks table
CREATE INDEX index_tasks_on_project_id ON tasks (project_id);
CREATE INDEX index_tasks_on_assigned_to_id ON tasks (assigned_to_id);

-- Comments table
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for comments table
CREATE INDEX index_comments_on_task_id ON comments (task_id);
CREATE INDEX index_comments_on_user_id ON comments (user_id);

-- Attachments table (polymorphic)
CREATE TABLE attachments (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(255),
    file_size INTEGER,
    file_path VARCHAR(255) NOT NULL,
    attachable_type VARCHAR(255) NOT NULL,
    attachable_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for polymorphic relationship
CREATE INDEX index_attachments_on_attachable ON attachments (attachable_type, attachable_id);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_projects_timestamp BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_tasks_timestamp BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_comments_timestamp BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_attachments_timestamp BEFORE UPDATE ON attachments FOR EACH ROW EXECUTE FUNCTION update_timestamp();
\`\`\`

### Prisma Schema

\`\`\`prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                  Int       @id @default(autoincrement())
  email               String    @unique
  encryptedPassword   String    @map("encrypted_password")
  resetPasswordToken  String?   @map("reset_password_token") @unique
  resetPasswordSentAt DateTime? @map("reset_password_sent_at")
  rememberCreatedAt   DateTime? @map("remember_created_at")
  signInCount         Int       @default(0) @map("sign_in_count")
  currentSignInAt     DateTime? @map("current_sign_in_at")
  lastSignInAt        DateTime? @map("last_sign_in_at")
  currentSignInIp     String?   @map("current_sign_in_ip")
  lastSignInIp        String?   @map("last_sign_in_ip")
  confirmationToken   String?   @map("confirmation_token") @unique
  confirmedAt         DateTime? @map("confirmed_at")
  confirmationSentAt  DateTime? @map("confirmation_sent_at")
  unconfirmedEmail    String?   @map("unconfirmed_email")
  firstName           String?   @map("first_name")
  lastName            String?   @map("last_name")
  admin               Boolean   @default(false)
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  // Relations
  projects Project[]
  tasks    Task[]    @relation("AssignedTasks")
  comments Comment[]

  @@map("users")
}

model Project {
  id          Int       @id @default(autoincrement())
  name        String
  description String?
  userId      Int       @map("user_id")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")
  status      String    @default("active")

  // Relations
  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks Task[]

  @@index([deletedAt])
  @@map("projects")
}

model Task {
  id           Int       @id @default(autoincrement())
  title        String
  description  String?
  projectId    Int       @map("project_id")
  assignedToId Int?      @map("assigned_to_id")
  status       String    @default("pending")
  dueDate      DateTime? @map("due_date")
  priority     Int       @default(0)
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  // Relations
  project    Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignedTo User?     @relation("AssignedTasks", fields: [assignedToId], references: [id], onDelete: SetNull)
  comments   Comment[]

  @@map("tasks")
}

model Comment {
  id        Int      @id @default(autoincrement())
  content   String
  userId    Int      @map("user_id")
  taskId    Int      @map("task_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@map("comments")
}

model Attachment {
  id             Int      @id @default(autoincrement())
  fileName       String   @map("file_name")
  contentType    String?  @map("content_type")
  fileSize       Int?     @map("file_size")
  filePath       String   @map("file_path")
  attachableType String   @map("attachable_type")
  attachableId   Int      @map("attachable_id")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@index([attachableType, attachableId], name: "index_attachments_on_attachable")
  @@map("attachments")
}
\`\`\`

> This is a blockquote that can be used to highlight important information.

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data     | Data     |
| Row 2    | Data     | Data     |
`

export const BuildWithMarkdown: Story = {
  args: {
    agent: 'build',
    state: 'default',
    message: (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props: CodeProps) {
            const { children, className, ...rest } = props
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match && !className

            return !isInline && match ? (
              <SyntaxHighlighter
                style={syntaxTheme}
                language={match[1]}
                PreTag="div"
                customStyle={syntaxCustomStyle}
                codeTagProps={syntaxCodeTagProps}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...rest}>
                {children}
              </code>
            )
          },
        }}
      >
        {markdownContent}
      </ReactMarkdown>
    ),
    time: '12:15',
  },
}

export const AskWithMarkdown: Story = {
  args: {
    agent: 'ask',
    state: 'default',
    message: (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props: CodeProps) {
            const { children, className, ...rest } = props
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match && !className

            return !isInline && match ? (
              <SyntaxHighlighter
                style={syntaxTheme}
                language={match[1]}
                PreTag="div"
                customStyle={syntaxCustomStyle}
                codeTagProps={syntaxCodeTagProps}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...rest}>
                {children}
              </code>
            )
          },
        }}
      >
        {markdownContent}
      </ReactMarkdown>
    ),
    time: '12:15',
  },
}

// Sample options for MessageOptionButtons
const sampleOptions: MessageOption[] = [
  { id: 'option1', text: 'Option 1' },
  { id: 'option2', text: 'Option 2' },
  { id: 'option3', text: 'Option 3' },
]

export const BuildWithOptions: Story = {
  args: {
    agent: 'build',
    state: 'default',
    message: 'Please select from the following options:',
    time: '12:30',
    agentName: 'Build Agent',
    children: (
      <MessageOptionButtons options={sampleOptions} agentType="build" />
    ),
  },
}

export const AskWithOptions: Story = {
  args: {
    agent: 'ask',
    state: 'default',
    message: 'Please select from the following options:',
    time: '12:30',
    agentName: 'Ask Agent',
    children: <MessageOptionButtons options={sampleOptions} agentType="ask" />,
  },
}

export const BuildWithMultiSelectOptions: Story = {
  args: {
    agent: 'build',
    state: 'default',
    message: 'Please select multiple options that apply:',
    time: '12:35',
    agentName: 'Build Agent',
    children: (
      <MessageOptionButtons
        options={[
          { id: 'option1', text: 'Option 1: Database design' },
          { id: 'option2', text: 'Option 2: API implementation' },
          { id: 'option3', text: 'Option 3: UI components' },
        ]}
        agentType="build"
        multiSelect={true}
      />
    ),
  },
}

export const AskWithMultiSelectOptions: Story = {
  args: {
    agent: 'ask',
    state: 'default',
    message: 'Please select multiple options that apply:',
    time: '12:35',
    agentName: 'Ask Agent',
    children: (
      <MessageOptionButtons
        options={[
          { id: 'option1', text: 'Option 1: Performance optimization' },
          { id: 'option2', text: 'Option 2: Security measures' },
          { id: 'option3', text: 'Option 3: Accessibility improvements' },
        ]}
        agentType="ask"
        multiSelect={true}
      />
    ),
  },
}
