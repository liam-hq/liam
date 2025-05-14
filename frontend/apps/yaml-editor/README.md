# YAML Editor with Version History

A lightweight two-pane YAML editor that lets users edit YAML documents, view past versions, and revert to previous versions. All data is stored in memory.

## Features

- Monaco editor with YAML syntax highlighting
- Version history with timestamps
- Efficient storage using JSON patches (RFC 6902)
- Ability to revert to any previous version
- Unsaved changes warning
- Toast notifications for user actions

## Tech Stack

- Vite + React 18 + TypeScript
- Tailwind CSS for styling
- Monaco Editor in YAML mode
- js-yaml for YAML ⇄ JSON conversion
- fast-json-patch for RFC 6902 diff/patch operations
- Zustand for state management
- shadcn/ui components

## Local Development

### Prerequisites

- Node.js (v16 or later)
- pnpm (recommended) or npm

### Setup

1. Clone the repository
2. Install dependencies:

\`\`\`bash
pnpm install
\`\`\`

3. Start the development server:

\`\`\`bash
pnpm dev
\`\`\`

4. Open your browser at http://localhost:5173

## Deployment to Vercel

### Option 1: Direct Deployment

1. Install Vercel CLI:

\`\`\`bash
npm install -g vercel
\`\`\`

2. Deploy to Vercel:

\`\`\`bash
vercel --prod
\`\`\`

### Option 2: Manual Build and Deploy

1. Build the project:

\`\`\`bash
pnpm build
\`\`\`

2. The build output will be in the `dist` directory.

3. Deploy the `dist` directory to any static hosting service, including Vercel.

## How It Works

1. The editor uses Monaco Editor for YAML editing with syntax highlighting.
2. When a user saves a version:
   - The first version stores the full document as JSON
   - Subsequent versions store only the differences (patches) from the previous version
3. To display any version, the app starts with the base version and applies patches in sequence.
4. Reverting to a version creates a new version with the changes needed to go back to that state.

## Project Structure

- `src/App.tsx` - Main layout with the two-pane grid
- `src/VersionList.tsx` - Left pane component showing version history
- `src/YamlEditor.tsx` - Right pane component with Monaco editor
- `src/versionStore.ts` - State management with Zustand + JSON-Patch helpers
